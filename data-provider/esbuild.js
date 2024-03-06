const esbuild = require("esbuild");
const fs = require("fs");

esbuild.build({
  entryPoints: [ "src/index.ts" ],
  bundle: true,
  outfile: "build/index.js",
  platform: "node",
  plugins: [
    {
      name: "jsdom-patch",
      setup(build) {
        build.onLoad({ filter: /XMLHttpRequest-impl\.js$/ }, async args => {
          let contents = await fs.promises.readFile(args.path, "utf8");
          contents = contents.replace(
            "const syncWorkerFile = require.resolve ? require.resolve(\"./xhr-sync-worker.js\") : null;",
            `const syncWorkerFile = "${require.resolve("jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js")}";`.replaceAll("\\", process.platform === "win32" ? "\\\\" : "\\")
          );
          return { contents, loader: "js" };
        });
      }
    }
  ]
}).catch(() => process.exit(1));
