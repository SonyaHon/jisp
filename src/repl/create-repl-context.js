const { Context } = require("../context");
const fs = require("node:fs/promises");
const path = require("node:path");
const { evaluate } = require("../evaluator");
const { read } = require("../reader");

module.exports = async function createREPLContext() {
  const ctx = new Context();
  ctx.set(Symbol.for("read-string"), read);
  ctx.set(Symbol.for("eval"), async (data) => await evaluate(data, ctx));
  ctx.set(Symbol.for("slurp"), async (path) => {
    return await fs.readFile(path, "utf-8");
  });
  ctx.set(Symbol.for("str"), async (...args) => {
    return args.join("");
  });
  ctx.set(Symbol.for("concat"), async (...arrays) => {
    const resultingArray = [];
    for (const array of arrays) {
      resultingArray.push(...array);
    }
    return resultingArray;
  });
  ctx.set(Symbol.for("cons"), async (arg, array) => {
    array.unshift(arg);
    return array;
  });

  const coreText = await fs.readFile(path.join(__dirname, "../jisp/core.jisp"));
  await evaluate(read(`(do ${coreText} nil)`), ctx);

  const replContext = new Context(ctx);
  return replContext;
};
