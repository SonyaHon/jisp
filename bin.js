#!/usr/bin/env node
const { compile, run } = require("./src/compiler");
const { resolve } = require("node:path");
const { startREPL } = require("./src/repl");

require("yargs")
  .scriptName("jisp")
  .usage("$0 <command> [options]")
  .command("repl", "Start a JISP repl", {}, function () {
    startREPL();
  })
  .command(
    "compile [options] <path>",
    "Compiles file to javascript",
    function (yargs) {
      yargs
        .positional("path", {
          type: "string",
          required: true,
          description: "entry .jisp file",
        })
        .option("output", {
          alias: "o",
          type: "string",
          default: "build.js",
        })
        .option("platform", {
          alias: "p",
          type: "string",
          default: "node",
        })
        .option("mode", {
          alias: "m",
          type: "string",
          default: "development",
        })
        .option("debug", {
          type: "boolean",
          default: false,
        });
    },
    async function ({ path, output, platform, mode, debug }) {
      await compile({
        entry: path,
        outputfile: resolve(process.cwd(), output),
        mode,
        platform,
        debug,
      });
    }
  )
  .command(
    "run <path>",
    "Run file at path",
    function (yargs) {
      yargs
        .positional("path", {
          type: "string",
          required: true,
          description: ".jisp file path",
        })
        .option("debug", {
          type: "boolean",
          default: false,
        });
    },
    async function ({ path, debug }) {
      await run(path, debug);
    }
  )
  .demandCommand()
  .help().argv;
