const fs = require("node:fs");
const path = require("node:path");
const { read } = require("../reader");
const { generateJs, generateImports } = require("./generator");

module.exports = function jispLoader(src) {
  const { debug } = this.getOptions();

  const dep = path.resolve(__dirname, "template/entry.js");
  const jispCore = path.resolve(__dirname, "../jisp/core.jisp");
  this.addDependency(jispCore);
  this.addDependency(dep);

  const data = read(`(do ${fs.readFileSync(jispCore)} ${src} nil)`);
  const { imports, importBindings, restData } = generateImports(data);
  const generatedCode = generateJs(restData);

  const entryFile = fs.readFileSync(dep, "utf-8");

  const result = entryFile
    .replace("__$IMPORTS$__", imports)
    .replace("__$IMPORT_BINDINGS$__", importBindings)
    .replace("__$GENERATED$__", generatedCode);
  if (debug) {
    console.debug(result);
  }
  return result;
};
