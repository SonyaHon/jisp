const repl = require("node:repl");
const fs = require("node:fs/promises");

const { evaluate } = require("../evaluator");
const { read } = require("../reader");
const { Context } = require("../context");

function startREPL() {
  const setContext = () => {
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
    return ctx;
  };

  const r = repl.start({
    prompt: "userspace <$> ",
    eval: async function (cmd, context, filename, callback) {
      const data = read(cmd);
      const evaluated = await evaluate(data, context);
      callback(null, evaluated);
    },
    useColors: true,
  });

  r.context = setContext();
  r.on("reset", () => {
    r.context = setContext();
  });
}

module.exports = {
  startREPL,
};
