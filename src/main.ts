import {Plugin, WorkspaceLeaf} from "obsidian";
import {VIEW_TYPE_HTML, HTML_EXTENSIONS} from "./constants";
import {HtmlFileView} from "./views/HtmlFileView";
import {DEFAULT_SETTINGS, HtmlReaderSettingTab} from "./settings";
import type {HtmlReaderSettings} from "./settings";

export default class HtmlReaderPlugin extends Plugin {
	settings: HtmlReaderSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_HTML, (leaf: WorkspaceLeaf) => {
			return new HtmlFileView(leaf, this.settings);
		});

		this.registerExtensions(HTML_EXTENSIONS, VIEW_TYPE_HTML);

		this.addSettingTab(new HtmlReaderSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<HtmlReaderSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);

		this.app.workspace.getLeavesOfType(VIEW_TYPE_HTML).forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof HtmlFileView) {
				view.updateSettings(this.settings);
			}
		});
	}
}
