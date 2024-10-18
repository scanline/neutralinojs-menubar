const MenuItem = require("./MenuItem");
const Accelerator = require("./Accelerator");
const EventEmitter = require("./EventEmitter");

class Menu extends EventEmitter {
	_items = [];
	static _applicationMenu;
	static _openFrames = [];
	static _mouseInterval;
	static _mouseX;
	static _mouseY;

	constructor() {
		super();
	}

	append(menuItem) {
		if (menuItem instanceof MenuItem) {
			this._items.push(menuItem);
		} else {
			this._items.push(new MenuItem(menuItem));
		}
		if (this._items[this._items.length - 1].submenu) {
			this._items[this._items.length - 1].submenu._parent = this;
		}
	}

	static _find(menu, id, found) {
		menu.every(item => {
			if (item.id == id) {
				found = item;
				return false;
			}
			if (item.submenu) {
				found = Menu._find(item.submenu.items, id, found);
			}

			return true;
		});

		return found;
	}

	getMenuItemById(id) {
		return Menu._find(this._items, id, null);
	}

	insert(pos, menuItem) {
		pos = pos > this._items.length - 1 ? this._items.length - 1 : pos;
		pos = pos < 0 ? 0 : pos;
		if (menuItem instanceof MenuItem) {
			this._items.splice(pos, 0, menuItem);
		} else {
			this._items.splice(pos, 0, new MenuItem(menuItem));
		}
		if (this._items[pos].submenu) {
			this._items[pos].submenu._parent = this;
		}
	}

	popup(options) {
		let isApplicationMenu = false;
		let tempMenu = this;
		while (tempMenu._parent) {
			tempMenu = tempMenu._parent;
		}
		if (tempMenu == Menu._applicationMenu) {
			isApplicationMenu = true;
		}
		let frame = document.createElement("menu-frame");
		let x = options?.x != null ? options.x : isApplicationMenu == false ? Menu._mouseX : 0;
		let y = options?.y != null ? options.y : isApplicationMenu == false ? Menu._mouseY : 0;
		//TODO: ignore elements which are invisible - should not count for hasCheckBox or hasSubmenu
		let hasCheckBox = this.items.flatMap(el => el.type == "checkbox" ? [el] : []).length > 0;
		let hasSubmenu = this.items.flatMap(el => el.submenu ? [el] : []).length > 0;
		let checkboxColumn = hasCheckBox == true ? "aria-checkboxcolumn='true'" : "";
		let submenuColumn = hasSubmenu == true ? "" : "aria-nosubmenu='true'";
		let accelerator;
		this.items.forEach(menuItem => {
			if (menuItem.visible == false) {
				return;
			}
			const subEl = menuItem.type == "separator" ? document.createElement("sub-menu-divider") : document.createElement("sub-menu-element");
			if (menuItem.submenu) {
				subEl.setAttribute("aria-submenu", "true");
			}
			if (menuItem.type == "checkbox" && menuItem.checked) {
				subEl.setAttribute("aria-checked", "true");
			}
			if (menuItem.enabled == false) {
				subEl.setAttribute("aria-state", "disabled");
			}
			if (menuItem.type != "separator") {
				accelerator = menuItem.accelerator != null ? menuItem.accelerator.replaceAll("+", "+ ") : "";
				subEl.innerHTML = `<div ${checkboxColumn}></div><span ${submenuColumn}>${menuItem.label}</span><span>${accelerator}</span><div></div>`;
				if (menuItem.enabled) {
					subEl.addEventListener("click", (evt) => {
						clearTimeout(Menu._mouseInterval);

						if (menuItem.type == "checkbox") {
							menuItem.checked = !menuItem.checked;
							subEl.setAttribute("aria-checked", menuItem.checked.toString());
						}
						if (menuItem.click) {
							menuItem.click();
						}
						if (menuItem.submenu == null) {
							Menu._closeMenu(evt);
						}
						evt.stopPropagation();
					});

					subEl.addEventListener("mouseover", (evt) => {
						clearTimeout(Menu._mouseInterval);
						let targ = evt.currentTarget;
						Menu._mouseInterval = setTimeout(() => {
							if (menuItem.submenu && Menu._openFrames.length > 0) {
								let lastFrame = Menu._openFrames[Menu._openFrames.length - 1].frame.getBoundingClientRect();
								if (Menu._openFrames.find(el => el.menu == menuItem.submenu) == null) {
									clearTimeout(Menu._mouseInterval);
									let shiftX = 0;
									let shiftY = 0;
									if (NL_OS == "Linux") {
										shiftY = -6;
									} else
									if (NL_OS == "Windows") {
										shiftX = -2;
										shiftY = 1;
									}
									menuItem.submenu.popup({
										x: lastFrame.x + lastFrame.width + shiftX,
										y: targ.getBoundingClientRect().y - targ.getBoundingClientRect().height + shiftY
									});
								}
							} else {
								let index = Menu._openFrames.length - 1;
								let el = Menu._openFrames[index];

								while (el && el.menu != this) {
									el.frame.remove();
									Menu._openFrames.splice(index, 1)
									index--;
									el = Menu._openFrames[index];
								}
							}
						}, 400);
					});
				}
			}
			frame.appendChild(subEl);
		});

		if (document.querySelector("menu-container") == null) {
			if (document.querySelector("menu-bar") == null) {
				document.body.insertBefore(document.createElement("menu-container"), document.body.children[0]);
			} else {
				document.body.insertBefore(document.createElement("menu-container"), document.querySelector("menu-bar").nextSibling);
			}


		}
		document.querySelector("menu-container").appendChild(frame);

		frame.style.top = y + "px";
		frame.style.left = x + "px";
		Menu._openFrames.push({
			frame: frame,
			menu: this
		});
	}

	get items() {
		return this._items;
	}

	static buildFromTemplate(template) {
		const menu = new Menu();
		template.forEach(item => {
			menu.append(item);
		});

		return menu;
	}

	static setApplicationMenu(menu) {
		let menuBar = document.querySelector("menu-bar") == null ? document.createElement("menu-bar") : document.querySelector("menu-bar");
		menuBar.innerHTML = "";

		menu.items.forEach(item => {
			const menuItem = document.createElement("menu-element");
			let menuTitle = item.label;
			if (menuTitle.match(/&&/) == null && menuTitle.indexOf("&") != -1) {
				Accelerator.addAccelerator("Alt+" + menuTitle.match(/&./)[0].charAt(1).toUpperCase(), () => {
					menuItem.dispatchEvent(new Event("mousedown", {
						bubbles: true,
						cancelable: true
					}));
				});
				menuTitle = "<menu-title>" + menuTitle.replace(menuTitle.match(/&./)[0], `<menu-title aria-state='underline'>${menuTitle.match(/&./)[0].charAt(1)}</menu-title>`) + "</menu-title>";
			} else {
				menuTitle = `<menu-title>${item.label.replace("&&","&")}</menu-title>`;
			}
			menuItem.innerHTML = menuTitle;
			menuItem.addEventListener("mouseover", (evt) => {
				let target = evt.target.closest("sub-menu-element") ? evt.target.closest("sub-menu-element") : evt.target;
				switch (target.constructor.name) {
					case "MenuElement":
						if (document.querySelector("menu-element[aria-state='active']") && document.querySelector("menu-element[aria-state='active']") != target) {
							Menu._menuClicked(menu, target);
						}
						break;
				}
			});
			menuItem.addEventListener("mousedown", (evt) => {
				let target = evt.target.closest("sub-menu-element") ? evt.target.closest("sub-menu-element") : evt.currentTarget;
				switch (target.constructor.name) {
					case "MenuElement":

						Menu._menuClicked(menu, target);

						break;
				}
			});
			menuBar.appendChild(menuItem);
		});

		if (document.body.contains(menuBar) == false) {
			document.body.insertBefore(menuBar, document.body.children[0]);
		}

		if (document.querySelector("menu-container") == null) {
			document.body.insertBefore(document.createElement("menu-container"), menuBar.nextSibling);
		}
		document.querySelector("menu-container").innerHTML = "";

	  
	  

		Menu._applicationMenu = menu;
	}

	static _init() {
		document.addEventListener("mouseup", (evt) => {
			Menu._mouseX = evt.clientX;
			Menu._mouseY = evt.clientY - parseInt(getComputedStyle(document.body).marginTop)
			let target = evt.target.closest("sub-menu-element") ? evt.target.closest("sub-menu-element") : evt.target;
			switch (target.constructor.name) {
				case "MenuElement":
				case "SubMenuElement":
				case "MenuTitle":

					break;
				case "MenuBar":
				default:
					Menu._closeMenu(evt);
					break;
			}
		}, true);

		Accelerator.addAccelerator("Escape", Menu._closeMenu);
	}

	static getApplicationMenu() {
		return Menu._applicationMenu;
	}

	static _closeMenu(evt) {
		if (document.querySelector("menu-container")?.innerHTML != "") {
			if (evt) {
				evt.stopPropagation();
			}
		}
		Array.from(document.querySelectorAll("menu-bar > menu-element")).forEach(el2 => {
			el2.setAttribute("aria-state", "");
		});
		Menu._openFrames = [];
		if (document.querySelector("menu-container")) {
			document.querySelector("menu-container").innerHTML = "";
		}
	}

	static _menuClicked(menu, target) {
		Array.from(document.querySelectorAll("menu-bar > menu-element")).forEach(el => {
			if (el != target) {
				el.setAttribute("aria-state", "");
			}
		});
		Menu._openFrames = [];
		if (target.getAttribute("aria-state") == "active") {
			target.setAttribute("aria-state", "");
			document.querySelector("menu-container").innerHTML = "";
		} else {
			target.setAttribute("aria-state", "active");
			document.querySelector("menu-container").innerHTML = "";
			clearTimeout(Menu._mouseInterval);

			menu.items[Array.from(document.querySelectorAll("menu-bar > menu-element")).findIndex(el => el == target)].submenu?.popup({
				x: target.getBoundingClientRect().x,
				y: target.getBoundingClientRect().y
			});
		}
	}
}

module.exports = Menu;