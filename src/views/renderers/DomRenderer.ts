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

		// Always sanitize on mobile — scripts must never run via DOM insertion.
		// Force at least Balanced mode even if user selected Unrestricted.
		const mobileSettings = settings.securityMode === SecurityMode.Unrestricted
			? {...settings, securityMode: SecurityMode.Balanced}
			: settings;
		const sanitized = sanitizeHtml(html, mobileSettings);

		if (settings.darkModeSupport) {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(DARK_MODE_SHADOW_CSS);
			shadow.adoptedStyleSheets = [sheet];
		}

		const parser = new DOMParser();
		const parsed = parser.parseFromString(sanitized, "text/html");
		const wrapper = document.createElement("div");
		while (parsed.body.firstChild) {
			wrapper.appendChild(parsed.body.firstChild);
		}
		shadow.appendChild(wrapper);
	}
}
