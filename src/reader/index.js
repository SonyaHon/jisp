const { JISPParser } = require("./parser");
const { JISPTokenizer } = require("./tokenizer");

function read(text) {
  const lexed = JISPTokenizer.tokenize(text);
  const parser = new JISPParser();

  parser.input = lexed.tokens;
  const ast = parser.parse();

  if (parser.errors.length > 0) {
    console.error(parser.errors);
    throw new Error("Error detected: ", parser.errors);
  }

  return ast;
}

module.exports = {
  read,
};
