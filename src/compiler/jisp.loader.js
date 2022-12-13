const fs = require("node:fs");
const path = require("node:path");
const { read } = require("../reader");
const { generateJs } = require("./generator");

module.exports = function jispLoader(src) {
  const { debug } = this.getOptions();
  const data = read(`(do ${src} nil)`);
  const generatedCode = generateJs(data);

  const dep = path.resolve(__dirname, "template/entry.js");
  this.addDependency(dep);

  const entryFile = fs.readFileSync(dep, "utf-8");
  const result = entryFile.replace("__$GENERATED$__", generatedCode);
  if (debug) {
    console.debug(result);
  }
  return result;
};
