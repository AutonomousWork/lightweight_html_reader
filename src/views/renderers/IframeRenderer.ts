import {SecurityMode} from "../../constants";
import type {HtmlReaderSettings} from "../../settings";
import {sanitizeHtml} from "../../sanitize";

const DARK_MODE_CSS = `<style data-html-reader-dark>
:root { color-scheme: light dark; }
@media (prefers-color-scheme: dark) {
	body { background-color: #1e1e1e; color: #d4d4d4; }
	a { color: #6cb6ff; }
}
</style>`;

export class IframeRenderer {
	render(container: HTMLElement, html: string, settings: HtmlReaderSettings): void {
		container.empty();

		const iframe = container.createEl("iframe", {
			cls: "html-reader-iframe",
		});

		iframe.setAttribute("sandbox", this.getSandboxValue(settings));

		let content = html;
		if (settings.securityMode !== SecurityMode.Unrestricted) {
			content = sanitizeHtml(html, settings);
		}

		if (settings.darkModeSupport) {
			content = this.injectDarkModeStyles(content);
		}

		iframe.setAttribute("srcdoc", content);
	}

	private getSandboxValue(settings: HtmlReaderSettings): string {
		if (settings.securityMode === SecurityMode.Unrestricted && settings.allowScripts) {
			return "allow-scripts allow-same-origin";
		}
		return "allow-same-origin";
	}

	private injectDarkModeStyles(html: string): string {
		if (html.includes("</head>")) {
			return html.replace("</head>", DARK_MODE_CSS + "</head>");
		}
		return DARK_MODE_CSS + html;
	}
}
