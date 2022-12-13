const { webpack } = require("webpack");
const { resolve } = require("path");
const Path = require("node:path");
const fs = require("node:fs/promises");
const Os = require("node:os");
const fork = require("node:child_process").fork;

const webpackConfig = (options) => ({
  entry: options.entry,
  output: {
    path: options.path,
    filename: options.filename,
  },
  mode: options.mode,
  target: options.platform,
  module: {
    rules: [
      {
        test: /\.jisp$/,
        use: [
          "babel-loader",
          { loader: "jisp-loader", options: { debug: options.debug } },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      __READER__: resolve(__dirname, "../reader"),
      __EVALUATOR__: resolve(__dirname, "../evaluator"),
      __CONTEXT__: resolve(__dirname, "../context"),
      __CORE_JISP__: resolve(__dirname, "./core.jisp"),
      __EMBEDDED_JS__: resolve(__dirname, "../extends/embedded-javascript"),
      __GLOBAL_CONTEXT__: resolve(__dirname, "./template/global-context.js"),
    },
  },
  resolveLoader: {
    alias: {
      "jisp-loader": resolve(__dirname, "jisp.loader.js"),
    },
  },
});

function compileAsync(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error || stats.hasErrors()) {
        const resolvedError = error || stats.toJson("errors-only").errors[0];
        const err = resolvedError.message || resolvedError;
        reject(err);
      }
      resolve(stats);
    });
  });
}

async function compile(options) {
  const filename = Path.basename(options.outputfile);
  const folder = Path.dirname(options.outputfile);
  const compiler = webpack(
    webpackConfig({
      ...options,
      path: folder,
      filename,
    })
  );
  await compileAsync(compiler);
}

async function run(path, debug) {
  const tempDir = Path.resolve(process.cwd(), ".temp-run");
  try {
    await fs.rm(tempDir, { recursive: true });
  } catch (e) {}
  await fs.mkdir(tempDir);

  const filename = "index.js";
  const compiler = webpack(
    webpackConfig({
      platform: "node",
      mode: "development",
      path: tempDir,
      filename,
      entry: path,
      debug,
    })
  );
  await compileAsync(compiler);
  fork(Path.join(tempDir, filename), { cwd: process.cwd(), detached: true });
}

module.exports = {
  compile,
  run,
};
