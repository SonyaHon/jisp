const repl = require("node:repl");

const { evaluate } = require("../evaluator");
const { read } = require("../reader");
const createREPLContext = require('./create-repl-context');

async function startREPL() {
  const r = repl.start({
    prompt: "userspace <$> ",
    eval: async function (cmd, context, filename, callback) {
      const data = read(cmd);
      const evaluated = await evaluate(data, context);
      callback(null, evaluated);
    },
    useColors: true,
  });

  r.context = await createREPLContext();
  r.on("reset", async () => {
    r.context = await createREPLContext();
  });
  r.defineCommand('showCurrentContext', function() {
    console.log(r.context);
    this.displayPrompt();
  });
}

module.exports = {
  startREPL,
  createREPLContext
};
