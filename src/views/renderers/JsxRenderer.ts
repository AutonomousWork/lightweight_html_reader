import {render} from "preact";
import type {ComponentChildren} from "preact";
import ReactCompat from "preact/compat";
import {SecurityMode} from "../../constants";
import {loadStandaloneComponent} from "../../jsx/standaloneComponent";
import {MESSAGE_STYLES, renderMessage} from "./renderMessage";
import type {RenderContext} from "./types";

const JSX_BASE_STYLES = `
${MESSAGE_STYLES}

:host {
	display: block;
	width: 100%;
	min-height: 100%;
	color: var(--text-normal);
	font-family: var(--font-text);
	line-height: var(--line-height-normal);
}

.jsx-reader-root {
	width: 100%;
	min-height: 100%;
}

.jsx-reader-root,
.jsx-reader-root * {
	box-sizing: border-box;
}

a {
	color: var(--link-color);
}

button,
input,
select,
textarea {
	font: inherit;
	color: inherit;
}

img,
svg,
video,
canvas {
	max-width: 100%;
}
`;

interface BoundaryProps {
	children: ComponentChildren;
}

interface BoundaryState {
	error: Error | null;
}

class ComponentErrorBoundary extends ReactCompat.Component<BoundaryProps, BoundaryState> {
	constructor(props: BoundaryProps) {
		super(props);
		this.state = {error: null};
	}

	static getDerivedStateFromError(error: Error): BoundaryState {
		return {error};
	}

	componentDidCatch(error: Error, errorInfo: unknown): void {
		console.error("Lightweight HTML Reader failed to render a JSX component.", error, errorInfo);
	}

	render(): ComponentChildren {
		if (!this.state.error) {
			return this.props.children;
		}

		return ReactCompat.createElement(
			"div",
			{className: "html-reader-message html-reader-message-error"},
			ReactCompat.createElement(
				"h3",
				{className: "html-reader-message-title"},
				"Component render failed",
			),
			ReactCompat.createElement(
				"p",
				{className: "html-reader-message-body"},
				"The JSX file loaded, but the component threw an error while rendering.",
			),
			ReactCompat.createElement(
				"pre",
				{className: "html-reader-message-details"},
				this.state.error.message,
			),
		);
	}
}

export class JsxRenderer {
	private mountEl: HTMLElement | null = null;

	render(container: HTMLElement, source: string, context: RenderContext): void {
		this.dispose();
		container.empty();

		if (!this.canRenderJsx(context)) {
			renderMessage(container, {
				title: "JSX rendering is disabled",
				message: "Set security mode to Unrestricted and enable Allow scripts to run standalone JSX or TSX components locally.",
			});
			return;
		}

		const shadowHost = container.createDiv({
			cls: "html-reader-shadow-host jsx-reader-shadow-host",
		});
		const shadowRoot = shadowHost.attachShadow({mode: "open"});
		const styleEl = shadowRoot.ownerDocument.createElement("style");
		styleEl.textContent = this.buildShadowStyles(context);
		shadowRoot.appendChild(styleEl);

		try {
			const entry = loadStandaloneComponent(
				source,
				context.file?.path ?? "component.jsx",
			);
			const mountEl = shadowRoot.ownerDocument.createElement("div");
			mountEl.className = "jsx-reader-root";
			shadowRoot.appendChild(mountEl);
			this.mountEl = mountEl;

			render(
				ReactCompat.createElement(
					ComponentErrorBoundary,
					null,
					ReactCompat.isValidElement(entry)
						? entry
						: ReactCompat.createElement(entry as never, null),
				),
				mountEl,
			);
		} catch (error) {
			console.error("Lightweight HTML Reader could not load a JSX component.", error);
			container.empty();
			renderMessage(container, {
				title: "Could not load JSX component",
				message: "The file could not be compiled or evaluated as a standalone React component.",
				details: formatError(error),
				variant: "error",
			});
		}
	}

	dispose(): void {
		if (this.mountEl) {
			render(null, this.mountEl);
			this.mountEl = null;
		}
	}

	private canRenderJsx(context: RenderContext): boolean {
		return context.settings.securityMode === SecurityMode.Unrestricted
			&& context.settings.allowScripts;
	}

	private buildShadowStyles(context: RenderContext): string {
		if (context.settings.darkModeSupport) {
			return `${JSX_BASE_STYLES}\n:host { color-scheme: light dark; }`;
		}

		return JSX_BASE_STYLES;
	}
}

function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}
