import {SecurityMode} from "./constants";
import type {HtmlReaderSettings} from "./settings";

const DANGEROUS_ATTRS = [
	"onclick", "ondblclick", "onmousedown", "onmouseup", "onmouseover",
	"onmousemove", "onmouseout", "onkeypress", "onkeydown", "onkeyup",
	"onload", "onerror", "onabort", "onblur", "onchange", "onfocus",
	"onreset", "onsubmit", "onselect", "onunload", "onbeforeunload",
	"onhashchange", "onmessage", "onoffline", "ononline", "onpagehide",
	"onpageshow", "onpopstate", "onstorage", "onresize", "onscroll",
	"ontouchstart", "ontouchmove", "ontouchend",
];

export function sanitizeHtml(html: string, settings: HtmlReaderSettings): string {
	switch (settings.securityMode) {
		case SecurityMode.Restricted:
			return sanitizeRestricted(html);
		case SecurityMode.Balanced:
			return sanitizeBalanced(html);
		case SecurityMode.Unrestricted:
			return html;
	}
}

function sanitizeRestricted(html: string): string {
	const doc = new DOMParser().parseFromString(html, "text/html");

	const dangerousTags = [
		"script", "noscript", "iframe", "frame", "frameset",
		"object", "embed", "applet", "form", "input",
		"textarea", "select", "button", "style",
	];
	for (const tag of dangerousTags) {
		doc.querySelectorAll(tag).forEach(el => el.remove());
	}

	doc.querySelectorAll("*").forEach(el => {
		removeDangerousAttributes(el);
		el.removeAttribute("style");
	});

	sanitizeJavascriptUrls(doc);

	return doc.documentElement.outerHTML;
}

function sanitizeBalanced(html: string): string {
	const doc = new DOMParser().parseFromString(html, "text/html");

	const scriptTags = [
		"script", "noscript", "iframe", "frame",
		"frameset", "object", "embed", "applet",
	];
	for (const tag of scriptTags) {
		doc.querySelectorAll(tag).forEach(el => el.remove());
	}

	doc.querySelectorAll("*").forEach(el => {
		removeDangerousAttributes(el);
	});

	sanitizeJavascriptUrls(doc);

	return doc.documentElement.outerHTML;
}

function removeDangerousAttributes(el: Element): void {
	for (const attr of DANGEROUS_ATTRS) {
		el.removeAttribute(attr);
	}
	for (const attr of Array.from(el.attributes)) {
		if (attr.name.toLowerCase().startsWith("on")) {
			el.removeAttribute(attr.name);
		}
	}
}

function sanitizeJavascriptUrls(doc: Document): void {
	doc.querySelectorAll("[href]").forEach(el => {
		const href = el.getAttribute("href");
		if (href && href.trim().toLowerCase().startsWith("javascript:")) {
			el.removeAttribute("href");
		}
	});
	doc.querySelectorAll("[src]").forEach(el => {
		const src = el.getAttribute("src");
		if (src && src.trim().toLowerCase().startsWith("javascript:")) {
			el.removeAttribute("src");
		}
	});
}
