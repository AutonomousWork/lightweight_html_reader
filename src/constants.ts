export const VIEW_TYPE_HTML = "html-reader-view";

export const HTML_EXTENSIONS = ["html", "htm"] as const;
export const JSX_EXTENSIONS = ["jsx", "tsx"] as const;
export const SUPPORTED_EXTENSIONS = [...HTML_EXTENSIONS, ...JSX_EXTENSIONS];

export enum SecurityMode {
	Restricted = "restricted",
	Balanced = "balanced",
	Unrestricted = "unrestricted",
}

export enum RenderableFileKind {
	Html = "html",
	Jsx = "jsx",
}

export function getRenderableFileKind(extension?: string): RenderableFileKind | null {
	const normalizedExtension = extension?.toLowerCase();

	if (!normalizedExtension) {
		return null;
	}

	if ((HTML_EXTENSIONS as readonly string[]).includes(normalizedExtension)) {
		return RenderableFileKind.Html;
	}

	if ((JSX_EXTENSIONS as readonly string[]).includes(normalizedExtension)) {
		return RenderableFileKind.Jsx;
	}

	return null;
}
