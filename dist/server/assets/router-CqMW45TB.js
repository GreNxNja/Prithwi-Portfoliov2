import { HeadContent, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/styles.css?url
var styles_default = "/assets/styles-EaSRyUFA.css";
//#endregion
//#region src/routes/__root.tsx
var Route$1 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Prithwijit Ghosh — Engineer" },
			{
				name: "description",
				content: "Portfolio of Prithwijit Ghosh. Building sentient AI so I can enjoy my guitar sessions in peace."
			},
			{
				name: "theme-color",
				content: "#0a0a0c"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "48x48"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32.png"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "96x96",
				href: "/favicon-96.png"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				href: "/favicon-192.png"
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png"
			}
		]
	}),
	notFoundComponent: NotFound,
	shellComponent: RootDocument
});
function NotFound() {
	return /* @__PURE__ */ jsxs("main", {
		className: "flex min-h-svh flex-col justify-center px-[5vw]",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "font-mono text-xs tracking-[0.28em] text-ember uppercase",
				children: "404"
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "signature mt-5 text-[clamp(3rem,11vw,7.5rem)]",
				children: "Dead string."
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-6 max-w-md text-xl text-muted",
				children: "Nothing rings at this address."
			}),
			/* @__PURE__ */ jsx("a", {
				href: "/",
				className: "wipe mt-10 w-fit font-mono text-xs tracking-[0.2em] text-ember uppercase",
				children: "← Back to the top string"
			})
		]
	});
}
function RootDocument({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [
			/* @__PURE__ */ jsxs("div", {
				className: "backdrop",
				"aria-hidden": true,
				children: [/* @__PURE__ */ jsxs("div", {
					className: "backdrop-energy",
					children: [
						/* @__PURE__ */ jsx("div", { className: "backdrop-sweep" }),
						/* @__PURE__ */ jsx("div", { className: "backdrop-glow" }),
						/* @__PURE__ */ jsx("div", { className: "backdrop-spot" })
					]
				}), /* @__PURE__ */ jsx("div", { className: "backdrop-scan" })]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "progress",
				"aria-hidden": true
			}),
			/* @__PURE__ */ jsx("div", {
				className: "cursor-ring",
				"aria-hidden": true
			}),
			children,
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-BKUK2hxK.js");
//#endregion
//#region src/routeTree.gen.ts
var rootRouteChildren = { IndexRoute: createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") }).update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$1
}) };
var routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0
	});
}
//#endregion
export { getRouter };
