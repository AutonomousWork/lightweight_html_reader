import {Platform, TextFileView, WorkspaceLeaf} from "obsidian";
import {
	RenderableFileKind,
	VIEW_TYPE_HTML,
	getRenderableFileKind,
} from "../constants";
import type {HtmlReaderSettings} from "../settings";
import {IframeRenderer} from "./renderers/IframeRenderer";
import {DomRenderer} from "./renderers/DomRenderer";
import {JsxRenderer} from "./renderers/JsxRenderer";
import {renderMessage} from "./renderers/renderMessage";
import type {FileRenderer} from "./renderers/types";

export class HtmlFileView extends TextFileView {
	private settings: HtmlReaderSettings;
	private activeRenderer: FileRenderer | null = null;
	private readonly htmlRenderer: IframeRenderer | DomRenderer;
	private readonly jsxRenderer: JsxRenderer;
	private containerDiv: HTMLDivElement;

	constructor(leaf: WorkspaceLeaf, settings: HtmlReaderSettings) {
		super(leaf);
		this.settings = settings;
		this.htmlRenderer = Platform.isMobile
			? new DomRenderer()
			: new IframeRenderer();
		this.jsxRenderer = new JsxRenderer();
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
		this.disposeActiveRenderer();
		this.contentEl.empty();
	}

	setViewData(data: string, clear: boolean): void {
		if (clear) {
			this.disposeActiveRenderer();
			this.containerDiv.empty();
		}
		this.renderCurrentFile(data);
	}

	getViewData(): string {
		return this.data ?? "";
	}

	clear(): void {
		this.disposeActiveRenderer();
		this.containerDiv?.empty();
	}

	updateSettings(settings: HtmlReaderSettings): void {
		this.settings = settings;
		if (this.containerDiv && typeof this.data === "string") {
			this.renderCurrentFile(this.data);
		}
	}

	private renderCurrentFile(data: string): void {
		if (!this.containerDiv) {
			return;
		}

		const nextRenderer = this.getRendererForCurrentFile();

		if (this.activeRenderer && this.activeRenderer !== nextRenderer) {
			this.activeRenderer.dispose?.();
		}

		this.activeRenderer = nextRenderer;

		try {
			nextRenderer.render(this.containerDiv, data, {
				settings: this.settings,
				file: this.file,
			});
		} catch (error) {
			console.error("Lightweight HTML Reader could not render the current file.", error);
			this.disposeActiveRenderer();
			this.containerDiv.empty();
			renderMessage(this.containerDiv, {
				title: "Could not render file",
				message: "The file could not be displayed in this view.",
				details: error instanceof Error ? error.message : String(error),
				variant: "error",
			});
		}
	}

	private getRendererForCurrentFile(): FileRenderer {
		switch (getRenderableFileKind(this.file?.extension)) {
			case RenderableFileKind.Html:
				return this.htmlRenderer;
			case RenderableFileKind.Jsx:
				return this.jsxRenderer;
			default:
				throw new Error(`Unsupported file type: ${this.file?.extension ?? "unknown"}`);
		}
	}

	private disposeActiveRenderer(): void {
		this.activeRenderer?.dispose?.();
		this.activeRenderer = null;
	}
}
