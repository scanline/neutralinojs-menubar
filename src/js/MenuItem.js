const Accelerator = require("./Accelerator");
const Menu = require("./Menu");

class MenuItem {
	_click;
	role;
	type;
	label;
	sublabel;
	accelerator;
	visible;
	checked;
	id;
	_enabled;
	_registerAccelerator;

	constructor(param) {
		if (param.submenu != null && !(param.submenu.constructor.name == "Menu")) {
			this.submenu = Menu.buildFromTemplate(param.submenu);
		} else {
			const click = param.click || null;
			if (param?.type == "checkbox") {
				this._click = () => {
					this.checked = !this.checked;
					if (click) {
						click();
					}
				};
			} else {
				this._click = click;
			}
		}
		this.label = param.label;
		this.type = param.type || "normal";
		this.checked = param.checked != null ? param.checked : false;
		this._enabled = param.enabled != null ? param.enabled : true;
		this.visible = param.visible != null ? param.visible : true;
		this.id = param.id || null;
		this.accelerator = param.accelerator || null;
		this._registerAccelerator = param.registerAccelerator != null ? param.registerAccelerator : true;

		if ((typeof this.accelerator) == "string") {
			this.accelerator = Accelerator.processAccelerator(this.accelerator)
			if (this._enabled && this._click != null && this._registerAccelerator) {
				Accelerator.addAccelerator(this.accelerator, this._click);
			}
		}
	}

	get enabled() {
		return this._enabled;
	}

	set enabled(param) {
		this._enabled = param;
		this._addAccelerator();
	}

	get registerAccelerator() {
		return this._registerAccelerator;
	}

	set registerAccelerator(param) {
		this._registerAccelerator = param;
		this._addAccelerator();
	}

	get click() {
		return this._click;
	}

	set click(param) {
		const click = param;
		if (this.type == "checkbox") {
			this._click = () => {
				this.checked = !this.checked;
				click();
			};
		} else {
			this._click = param;
		}
		this._addAccelerator();
	}

	_addAccelerator() {
		if ((typeof this.accelerator) == "string" && this._click != null && this._enabled && this._registerAccelerator) {
			Accelerator.addAccelerator(this.accelerator, this._click);
		} else {
			Accelerator.removeAccelerator(this.accelerator);
		}
	}

}

module.exports = MenuItem;