"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = require("@vitejs/plugin-react");
const path_1 = require("path");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    build: {
        outDir: 'out/webview-ui',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                index: path_1.default.resolve(__dirname, 'webview-ui/index.html'),
            },
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
            },
        },
    },
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, 'webview-ui/src'),
        },
    },
});
//# sourceMappingURL=vite.config.js.map