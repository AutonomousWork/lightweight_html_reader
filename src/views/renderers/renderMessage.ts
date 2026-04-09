export interface RenderMessageOptions {
	title: string;
	message: string;
	details?: string;
	variant?: "info" | "error";
}

export const MESSAGE_STYLES = `
.html-reader-message {
	margin: var(--size-4-4);
	padding: var(--size-4-4);
	border: 1px solid var(--background-modifier-border);
	border-radius: var(--radius-m);
	background: var(--background-secondary);
	color: var(--text-normal);
}

.html-reader-message-error {
	border-color: var(--text-error);
}

.html-reader-message-title {
	margin: 0 0 var(--size-2-2);
	font-size: var(--font-ui-medium);
	font-weight: 600;
}

.html-reader-message-body {
	margin: 0;
	line-height: var(--line-height-normal);
}

.html-reader-message-details {
	margin: var(--size-3-2) 0 0;
	white-space: pre-wrap;
	word-break: break-word;
	font-family: var(--font-monospace);
	font-size: var(--font-ui-small);
	color: var(--text-muted);
}
`;

export function renderMessage(
	target: HTMLElement | ShadowRoot,
	options: RenderMessageOptions,
): void {
	clearChildren(target);

	const doc = target.ownerDocument ?? document;
	const wrapper = doc.createElement("div");
	const variant = options.variant ?? "info";
	wrapper.className = `html-reader-message html-reader-message-${variant}`;

	const titleEl = doc.createElement("h3");
	titleEl.className = "html-reader-message-title";
	titleEl.textContent = options.title;
	wrapper.appendChild(titleEl);

	const bodyEl = doc.createElement("p");
	bodyEl.className = "html-reader-message-body";
	bodyEl.textContent = options.message;
	wrapper.appendChild(bodyEl);

	if (options.details) {
		const detailsEl = doc.createElement("pre");
		detailsEl.className = "html-reader-message-details";
		detailsEl.textContent = options.details;
		wrapper.appendChild(detailsEl);
	}

	target.appendChild(wrapper);
}

function clearChildren(target: HTMLElement | ShadowRoot): void {
	while (target.firstChild) {
		target.removeChild(target.firstChild);
	}
}
