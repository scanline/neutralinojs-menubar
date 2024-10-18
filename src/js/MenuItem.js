const Accelerator = require("./Accelerator");

class MenuItem {
	click;
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
		if (param.submenu != null && !(param.submenu instanceof Menu)) {
			this.submenu = Menu.buildFromTemplate(param.submenu);

		} else {
			this.click = param.click || null;
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
			if (this._enabled && this.click != null && this._registerAccelerator) {
				Accelerator.addAccelerator(this.accelerator, this.click);
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

	_addAccelerator() {
		if ((typeof this.accelerator) == "string" && this.click != null && this._enabled && this._registerAccelerator) {
			Accelerator.addAccelerator(this.accelerator, this.click);
		} else {
			Accelerator.removeAccelerator(this.accelerator);
		}
	}
}

module.exports = MenuItem;