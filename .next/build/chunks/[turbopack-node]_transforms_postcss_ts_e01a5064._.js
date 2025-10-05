module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/behind-v2-next/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "build/chunks/11cec_ed8a5e36._.js",
  "build/chunks/[root-of-the-server]__36b8aaf8._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/behind-v2-next/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];