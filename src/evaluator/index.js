const { evaluateForm } = require("./evaluator");

async function evaluate(form, context) {
  return await evaluateForm(form, context);
}

module.exports = { evaluate };
