const __context$ = require("__CONTEXT__").Context;
const __eval$ = require("__EVALUATOR__").evaluate;
const __read$ = require("__READER__").read;

const fs = require("node:fs/promises");

const globalContext = new __context$();

globalContext.set(Symbol.for("read-string"), __read$);
globalContext.set(
  Symbol.for("eval"),
  async (data) => await __eval$(data, globalContext)
);
globalContext.set(Symbol.for("slurp"), async (path) => {
  return await fs.readFile(path, "utf-8");
});
globalContext.set(Symbol.for("str"), async (...args) => {
  return args.join("");
});
globalContext.set(Symbol.for("concat"), async (...arrays) => {
  const resultingArray = [];
  for (const array of arrays) {
    resultingArray.push(...array);
  }
  return resultingArray;
});
globalContext.set(Symbol.for("cons"), async (arg, array) => {
  array.unshift(arg);
  return array;
});

module.exports = async () => {
  return globalContext;
};
