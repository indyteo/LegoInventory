const esbuild = require("esbuild");
const { copy } = require("esbuild-plugin-copy");

esbuild.build({
  entryPoints: [ "src/index.ts" ],
  bundle: true,
  outfile: "build/index.js",
  platform: "node",
  plugins: [
    copy({
      assets: [
        {
          from: [ "./node_modules/pdfkit/js/data/*.afm" ],
          to: [ "./data"]
        }
      ]
    })
  ]
}).catch(() => process.exit(1));
