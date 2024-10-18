class Accelerator {
	static _accelerators;
	static _fired = false;

	static removeAccelerator(accelerator) {
		if (Accelerator._accelerators.has(accelerator)) {
			Accelerator._accelerators.delete(accelerator);
		}
	}

	static addAccelerator(accelerator, func) {
		if (Accelerator._accelerators == null) {
			Accelerator._accelerators = new Map();
			window.addEventListener("keydown", (evt) => {
				let virtualAccelerator = "";
				if (evt.altKey && evt.ctrlKey) {
					virtualAccelerator += "AltGr+";
				}
				if (!evt.altKey && evt.ctrlKey) {
					if (NL_OS != "Darwin") {
						virtualAccelerator += "Ctrl+";
					} else {
						virtualAccelerator += "Cmd+";
					}
				}
				if (evt.altKey && !evt.ctrlKey) {
					virtualAccelerator += "Alt+";
				}
				if (evt.shiftKey) {
					virtualAccelerator += "Shift+";
				}

				if (evt.key.length == 1) {
					virtualAccelerator += evt.key == " " ? "Space" : evt.key.toUpperCase();
				} else {
					if (evt.key.match(/\b(?:Alt|Control|Shift)\b/i) == null) {
						if (evt.key.match(/Arrow/i)) {
							virtualAccelerator += evt.key.replace("Arrow", "");
						} else {
							virtualAccelerator += evt.key;
						}
					}
				}

				let storedAccelerator = Accelerator._accelerators.get(virtualAccelerator);
				if (storedAccelerator != null && Accelerator._fired == false) {
					Accelerator._fired = true;
					evt.preventDefault();
					storedAccelerator();
				}

			});
			window.addEventListener("keyup", (evt) => {
				Accelerator._fired = false;

			});
		}
		let realAccelerator = Accelerator.processAccelerator(accelerator);
		Accelerator._accelerators.set(realAccelerator, func);
	}

	static processAccelerator(userAccelerator) {
		let index;
		let realAccelerator = "";
		let accelerator = userAccelerator.split("+");
		//NOTE: AltGr should be ctrlKey and altKey to true!

		if ((index = accelerator.findIndex(el => el.match(/\b(?:Alt|AltGr)\b/i))) != -1) {
			realAccelerator += accelerator[index] + "+";
			accelerator.splice(index, 1);
		}
		if ((index = accelerator.findIndex(el => el.match(/\b(?:CommandOrControl|CmdOrCtrl|Command|Cmd|Control|Ctrl)\b/i))) != -1) {
			accelerator.splice(index, 1);
			if (realAccelerator.indexOf("AltGr") == -1) {
				if (NL_OS != "Darwin") {
					realAccelerator += "Ctrl+";
				} else {
					realAccelerator += "Cmd+";
				}
			}
		}
		if ((index = accelerator.findIndex(el => el.match(/Shift/i))) != -1) {
			accelerator.splice(index, 1);
			realAccelerator += "Shift+";
		}
		if ((index = accelerator.find(el => el.match(/^(Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen|F24|F23|F22|F21|F20|F19|F18|F17|F16|F15|F14|F13|F12|F11|F10|F9|F8|F7|F6|F5|F4|F3|F2|F1|[0-9A-Z)!@#$%^&*(:+<_>?~{|}";=,\-./`[\\\]'])/i))) != null) {
			if (index.length == 1) {
				realAccelerator += index.toUpperCase();
			} else {
				if (index == "Esc") {
					realAccelerator += "Escape";
				} else if (index == "Return") {
					realAccelerator += "Enter";
				} else {
					realAccelerator += index;
				}
			}
			accelerator.splice(index, 1);

		}

		return realAccelerator;
	}

}

module.exports = Accelerator;