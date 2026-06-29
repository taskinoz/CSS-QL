const path = require("node:path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");

esbuild.buildSync({
  absWorkingDir: root,
  entryPoints: ["demo/app.js"],
  outfile: "demo/bundle.js",
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: false,
  platform: "browser",
  target: ["es2022"],
  logLevel: "info",
});
