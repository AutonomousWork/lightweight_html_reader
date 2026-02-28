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

		const parser = new DOMParser();
		let doc: Document;

		if (settings.securityMode === SecurityMode.Unrestricted) {
			doc = parser.parseFromString(html, "text/html");
			doc.querySelectorAll("script").forEach(el => el.remove());
		} else {
			const sanitized = sanitizeHtml(html, settings);
			doc = parser.parseFromString(sanitized, "text/html");
		}

		// Extract <style> elements into adoptedStyleSheets.
		// Obsidian strips <style> DOM nodes (no-forbidden-elements); adopted sheets bypass this.
		const sheets: CSSStyleSheet[] = [];
		if (settings.darkModeSupport) {
			const darkSheet = new CSSStyleSheet();
			darkSheet.replaceSync(DARK_MODE_SHADOW_CSS);
			sheets.push(darkSheet);
		}
		for (const style of Array.from(doc.querySelectorAll("style"))) {
			let css = style.textContent ?? "";
			// :root and body selectors have no target in shadow DOM; remap to :host
			css = css.replace(/:root/g, ":host");
			css = css.replace(/(^|[\s,}])body(?=\s*\{)/gm, "$1:host");
			try {
				const sheet = new CSSStyleSheet();
				sheet.replaceSync(css);
				sheets.push(sheet);
			} catch { /* skip unparseable CSS */ }
			style.remove();
		}
		shadow.adoptedStyleSheets = sheets;

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
