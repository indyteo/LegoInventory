const esbuild = require("esbuild");

esbuild.build({
  entryPoints: [ "src/index.ts" ],
  bundle: true,
  outfile: "build/index.js",
  platform: "node"
}).catch(() => process.exit(1));
