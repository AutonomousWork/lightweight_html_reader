import {Platform, TextFileView, WorkspaceLeaf} from "obsidian";
import {VIEW_TYPE_HTML} from "../constants";
import type {HtmlReaderSettings} from "../settings";
import {IframeRenderer} from "./renderers/IframeRenderer";
import {DomRenderer} from "./renderers/DomRenderer";

export class HtmlFileView extends TextFileView {
	private settings: HtmlReaderSettings;
	private renderer: IframeRenderer | DomRenderer;
	private containerDiv: HTMLDivElement;

	constructor(leaf: WorkspaceLeaf, settings: HtmlReaderSettings) {
		super(leaf);
		this.settings = settings;
		this.renderer = Platform.isMobile
			? new DomRenderer()
			: new IframeRenderer();
	}

	getViewType(): string {
		return VIEW_TYPE_HTML;
	}

	getDisplayText(): string {
		return this.file?.basename ?? "HTML";
	}

	async onOpen(): Promise<void> {
		this.containerDiv = this.contentEl.createDiv({cls: "html-reader-container"});
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	setViewData(data: string, clear: boolean): void {
		if (clear) {
			this.containerDiv.empty();
		}
		this.renderer.render(this.containerDiv, data, this.settings);
	}

	getViewData(): string {
		return this.data;
	}

	clear(): void {
		this.containerDiv?.empty();
	}

	updateSettings(settings: HtmlReaderSettings): void {
		this.settings = settings;
		if (this.data && this.containerDiv) {
			this.containerDiv.empty();
			this.renderer.render(this.containerDiv, this.data, this.settings);
		}
	}
}
