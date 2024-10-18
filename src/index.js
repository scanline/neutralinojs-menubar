const menuBarLinux = require("./css/menuBarLinux.css");
const menuBarWin = require("./css/menuBarWin.css");
const Menu = require("./js/Menu");
const MenuItem = require("./js/MenuItem");

class MenuContainer extends HTMLElement {
	constructor() {
		super();
	}
}
class MenuBar extends HTMLElement {
	constructor() {
		super();
	}
}
class MenuElement extends HTMLElement {
	constructor() {
		super();
	}
}
class MenuTitle extends HTMLElement {
	constructor() {
		super();
	}
}
class SubMenuElement extends HTMLElement {
	constructor() {
		super();
	}
}
customElements.define("menu-container", MenuContainer);
customElements.define("menu-bar", MenuBar);
customElements.define("menu-element", MenuElement);
customElements.define("menu-title", MenuTitle);
customElements.define("sub-menu-element", SubMenuElement);

let css = menuBarWin;
if (NL_OS == "Linux") {
	css = menuBarLinux;
}
let style = document.createElement("style");
style.type = "text/css";
style.innerHTML = css;
document.getElementsByTagName("head")[0].appendChild(style);

Menu._init();

module.exports = {
	Menu,
	MenuItem
}