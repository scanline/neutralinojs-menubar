const browserify = require("browserify");
const fs = require("fs");
const path = require("path");
const minify = require("minify");

async function bundle(files, options = {}) {
	return new Promise((resolve, reject) => {
		browserify(files, options).bundle((err, buff) => {
			if (err) {
				console.log(err)
				reject();
			}
			resolve(buff.toString("utf8"));
		});
	});
}

(async () => {
	let args = process.argv.slice(2);
	let debug = args.find(el => el == "--debug") != null;
	let res = await bundle([path.join(__dirname, "../src/index.js")], {
		standalone: "NeutralinoMenuBar",
		transform: ["browserify-css"],
		debug: debug
	});
	if (!debug) {
		res = await minify.js(res, {
			js: {
				mangle: {
					keep_classnames: true
				}
			}
		});
	}
	if (fs.existsSync("dist") == false) {
		fs.mkdirSync("dist");
	}
	fs.writeFileSync("dist/NeutralinoMenuBar.min.js", res);
})();