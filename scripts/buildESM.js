const esbuild = require("esbuild");
const inlineImportPlugin = require("esbuild-plugin-inline-import");
const fs=require("fs");
const fsp = fs.promises;
const { promisify } = require("util");
const enhancedResolve = require("enhanced-resolve");
const moduleLexer = require("cjs-module-lexer");
const path = require("path");
const resolve = promisify(
	enhancedResolve.create({
		mainFields: ["browser", "module", "main"]
	})
);

let lexerInitialized = false;
async function getExports(modulePath) {
	if (!lexerInitialized) {
		await moduleLexer.init();
		lexerInitialized = true;
	}
	try {
		const exports = [];
		const paths = [];
		paths.push(await resolve(process.cwd(), modulePath));
		while (paths.length > 0) {
			const currentPath = paths.pop();
			const results = moduleLexer.parse(await fsp.readFile(currentPath, "utf8"));
			exports.push(...results.exports);
			for (const reexport of results.reexports) {
				paths.push(await resolve(path.dirname(currentPath), reexport));
			}
		}

		if (!exports.includes("default")) {
			exports.push("default");
		}
		return exports.join(", ");
	} catch (e) {
		console.log(e);
		return "default";
	}
}

const namedExportsPlugin = {
	name: "named-exports",
	setup(build) {
		build.onResolve({
			filter: /\.js/i
		}, (args) => {
			if (args.importer === "") {
				return {
					path: args.path,
					namespace: "ne"
				};
			}
		});
		build.onLoad({
			filter: /\.js/i,
			namespace: "ne"
		}, async (args) => {
			const keys = await getExports(args.path);
			const path = JSON.stringify(args.path);
			const resolveDir = process.cwd();
			return {
				contents: `export { ${keys} } from ${path}`,
				resolveDir
			};
		});
	},
};

const args = process.argv.slice(2);
const debug = args.find(el => el == "--debug") != null;

if (fs.existsSync("dist") == false) {
	fs.mkdirSync("dist");
}

esbuild.build({
	entryPoints: ["src/index.js"],
	bundle: true,
	outfile: "dist/NeutralinoMenuBar.esm.min.js",
	format: "esm",
	target: "es2020",
	minify: !debug,
	sourcemap: (debug == true ? "inline" : false),
	keepNames: true,
	plugins: [inlineImportPlugin({
		filter: /\.css$/i,
		transform: async (contents) => {
			const result = await esbuild.transform(contents, {
				loader: "css",
				minify: !debug
			});

			return result.code;
		}
	}), namedExportsPlugin],
});