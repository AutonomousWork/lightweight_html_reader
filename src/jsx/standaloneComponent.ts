import type {ComponentType, VNode} from "preact";
import ReactCompat from "preact/compat";
import * as ReactJsxRuntime from "preact/jsx-runtime";
import {transform} from "sucrase";

export type StandaloneComponentEntry = ComponentType | VNode;

const REACT_COMPONENT_SYMBOLS = new Set([
	Symbol.for("react.forward_ref"),
	Symbol.for("react.lazy"),
	Symbol.for("react.memo"),
]);

export function loadStandaloneComponent(source: string, filePath: string): StandaloneComponentEntry {
	const compiled = compileComponentSource(source, filePath);
	const moduleExports = evaluateComponentModule(compiled, filePath);

	return resolveEntry(moduleExports, filePath);
}

function compileComponentSource(source: string, filePath: string): string {
	try {
		return transform(source, {
			filePath,
			transforms: filePath.toLowerCase().endsWith(".tsx")
				? ["imports", "jsx", "typescript"]
				: ["imports", "jsx"],
			jsxImportSource: "react",
			jsxRuntime: "automatic",
			production: true,
		}).code;
	} catch (error) {
		throw new Error(`Could not compile ${filePath}: ${formatError(error)}`);
	}
}

function evaluateComponentModule(compiled: string, filePath: string): unknown {
	const module = {
		exports: {} as unknown,
	};
	const sourceUrl = encodeURI(filePath);

	try {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval
		const evaluator = new Function(
			"require",
			"module",
			"exports",
			`${compiled}\n//# sourceURL=${sourceUrl}`,
		) as (require: (specifier: string) => unknown, module: {exports: unknown}, exports: unknown) => void;
		evaluator(createRuntimeRequire(filePath), module, module.exports);
		return module.exports;
	} catch (error) {
		throw new Error(`Could not evaluate ${filePath}: ${formatError(error)}`);
	}
}

function createRuntimeRequire(filePath: string): (specifier: string) => unknown {
	return (specifier: string) => {
		switch (specifier) {
			case "react":
				return createReactRuntimeModule();
			case "react/jsx-dev-runtime":
				return ReactJsxRuntime;
			case "react/jsx-runtime":
				return ReactJsxRuntime;
			default:
				throw new Error(
					`Unsupported import "${specifier}" in ${filePath}. Standalone JSX files can only import from "react".`,
				);
		}
	};
}

function createReactRuntimeModule(): typeof ReactCompat & {default: typeof ReactCompat} {
	return {
		...ReactCompat,
		default: ReactCompat,
	};
}

function resolveEntry(moduleExports: unknown, filePath: string): StandaloneComponentEntry {
	const moduleRecord = isRecord(moduleExports) ? moduleExports : null;
	const candidates = [
		moduleRecord?.default,
		moduleRecord?.App,
		moduleRecord?.Component,
		moduleExports,
		...(moduleRecord ? Object.values(moduleRecord) : []),
	];

	const entry = candidates.find(isRenderableEntry);

	if (entry) {
		return entry;
	}

	throw new Error(
		`Could not find a React component export in ${filePath}. Export a default component or React element.`,
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isRenderableEntry(value: unknown): value is StandaloneComponentEntry {
	if (typeof value === "function" || ReactCompat.isValidElement(value)) {
		return true;
	}

	if (isRecord(value) && "$$typeof" in value) {
		return REACT_COMPONENT_SYMBOLS.has(value.$$typeof as symbol);
	}

	return false;
}

function formatError(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return String(error);
}
