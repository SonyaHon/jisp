const { createToken, Lexer } = require("chevrotain");

const Tokens = {
  Whitespace: createToken({
    name: "Whitespace",
    pattern: /[\s,]+/,
    group: Lexer.SKIPPED,
  }),
  Comment: createToken({
    name: "Comment",
    pattern: /;;.*/,
    group: Lexer.SKIPPED,
  }),
  ListOpen: createToken({
    name: "ListOpen",
    pattern: /\(/,
  }),
  ListClose: createToken({
    name: "ListClose",
    pattern: /\)/,
  }),
  QuoteNext: createToken({
    name: "QuoteNext",
    pattern: /'/,
  }),
  QuasiQuoteNext: createToken({
    name: "QuasiQuoteNext",
    pattern: /`/,
  }),
  SpliceUnquoteNext: createToken({
    name: "SpliceUnquoteNext",
    pattern: /~@/,
  }),
  UnquoteNext: createToken({
    name: "UnquoteNext",
    pattern: /~/,
  }),
  Nil: createToken({
    name: "Nil",
    pattern: /nil/,
  }),
  Boolean: createToken({
    name: "Boolean",
    pattern: /(true|false)/,
  }),
  Keyword: createToken({
    name: "Keyword",
    pattern: /:[-\w$?+/*!><|&\.]+/,
  }),
  DecimalNumber: createToken({
    name: "DecimalNumber",
    pattern: /\d+\.\d+|\.\d+|([1-9]\d*)|0/,
  }),
  EmbeddedJavaScript: createToken({
    name: "EmbeddedJavascript",
    pattern: /#js{((?!#js{)(\s|.))*}/s,
    line_breaks: true,
    start_chars_hint: ["#"],
  }),
  MapOpen: createToken({
    name: "MapOpen",
    pattern: /{/,
  }),
  MapClose: createToken({
    name: "MapClose",
    pattern: /}/,
  }),
  String: createToken({
    name: "String",
    pattern: /"[^"\\]*(?:\\.[^"\\]*)*"/s,
    line_breaks: true,
    start_chars_hint: ['"'],
  }),
  TypeHint: createToken({
    name: "TypeHint",
    pattern: /~[a-zA-Z]+/,
  }),
  Symbol: createToken({
    name: "Symbol",
    pattern: /[-\w$?+/*!><|&\.]+/,
  }),
};

const AllTokens = Object.values(Tokens);
const JISPTokenizer = new Lexer(AllTokens);

module.exports = {
  JISPTokenizer,
  Tokens,
  AllTokens,
};
