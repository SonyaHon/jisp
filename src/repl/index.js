const repl = require("node:repl");
const { evaluate } = require("../evaluator");
const { read } = require("../reader");
const { Context } = require("../context");

function startREPL() {
  const r = repl.start({
    prompt: "username <$> ",
    eval: async function (cmd, context, filename, callback) {
      const data = read(cmd);
      const evaluated = await evaluate(data, context);
      callback(null, evaluated);
    },
    useColors: true,
  });
  r.context = new Context();
  r.on("reset", () => {
    r.context = new Context();
  });
}

module.exports = {
  startREPL,
};
