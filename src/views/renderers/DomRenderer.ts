import type {HtmlReaderSettings} from "../../settings";
import {SecurityMode} from "../../constants";
import {sanitizeHtml} from "../../sanitize";

const DARK_MODE_SHADOW_CSS = `
:host {
	display: block;
	width: 100%;
	min-height: 100%;
}
@media (prefers-color-scheme: dark) {
	:host { background-color: #1e1e1e; color: #d4d4d4; }
	a { color: #6cb6ff; }
}
`;

export class DomRenderer {
	render(container: HTMLElement, html: string, settings: HtmlReaderSettings): void {
		container.empty();

		const shadowHost = container.createDiv({cls: "html-reader-shadow-host"});
		const shadow = shadowHost.attachShadow({mode: "open"});

		if (settings.darkModeSupport) {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(DARK_MODE_SHADOW_CSS);
			shadow.adoptedStyleSheets = [sheet];
		}

		const parser = new DOMParser();
		let doc: Document;

		if (settings.securityMode === SecurityMode.Unrestricted) {
			// Parse directly and strip only scripts for DOM safety.
			// Avoids the serialize→re-parse round-trip that can lose style elements.
			doc = parser.parseFromString(html, "text/html");
			doc.querySelectorAll("script").forEach(el => el.remove());
		} else {
			const sanitized = sanitizeHtml(html, settings);
			doc = parser.parseFromString(sanitized, "text/html");
		}

		const wrapper = document.createElement("div");
		for (const node of Array.from(doc.head.childNodes)) {
			wrapper.appendChild(node);
		}
		while (doc.body.firstChild) {
			wrapper.appendChild(doc.body.firstChild);
		}
		shadow.appendChild(wrapper);
	}
}
