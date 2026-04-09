import {App, PluginSettingTab, Setting} from "obsidian";
import {SecurityMode} from "./constants";
import type HtmlReaderPlugin from "./main";

export interface HtmlReaderSettings {
	securityMode: SecurityMode;
	allowScripts: boolean;
	darkModeSupport: boolean;
}

export const DEFAULT_SETTINGS: HtmlReaderSettings = {
	securityMode: SecurityMode.Balanced,
	allowScripts: false,
	darkModeSupport: true,
};

export class HtmlReaderSettingTab extends PluginSettingTab {
	plugin: HtmlReaderPlugin;

	constructor(app: App, plugin: HtmlReaderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Security mode")
			.setDesc("Controls how HTML content is sanitized before rendering. Component files such as .jsx and .tsx require unrestricted mode because they execute local code.")
			.addDropdown(dropdown => dropdown
				.addOption(SecurityMode.Restricted, "Restricted (strip scripts and styles)")
				.addOption(SecurityMode.Balanced, "Balanced (strip scripts, keep styles)")
				.addOption(SecurityMode.Unrestricted, "Unrestricted (no sanitization)")
				.setValue(this.plugin.settings.securityMode)
				.onChange(async (value) => {
					this.plugin.settings.securityMode = value as SecurityMode;
					await this.plugin.saveSettings();
					this.display();
				}));

		new Setting(containerEl)
			.setName("React component files")
			.setDesc("Standalone .jsx and .tsx files are supported when security mode is unrestricted and allow scripts is enabled.");

		if (this.plugin.settings.securityMode === SecurityMode.Unrestricted) {
			new Setting(containerEl)
				.setName("Allow scripts")
				.setDesc("Allow JavaScript execution in unrestricted HTML files and standalone .jsx or .tsx components. Use with caution and only for files you trust.")
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.allowScripts)
					.onChange(async (value) => {
						this.plugin.settings.allowScripts = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName("Dark mode support")
			.setDesc("Inject dark mode styles into rendered HTML to match the current theme.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.darkModeSupport)
				.onChange(async (value) => {
					this.plugin.settings.darkModeSupport = value;
					await this.plugin.saveSettings();
				}));
	}
}
