import type {TFile} from "obsidian";
import type {HtmlReaderSettings} from "../../settings";

export interface RenderContext {
	settings: HtmlReaderSettings;
	file: TFile | null;
}

export interface FileRenderer {
	render(container: HTMLElement, source: string, context: RenderContext): void;
	dispose?(): void;
}
