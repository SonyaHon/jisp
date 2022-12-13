const { EmbeddedActionsParser } = require("chevrotain");
const { Tokens, AllTokens } = require("./tokenizer");
const { Typehint } = require("../extends/typehint");
const { EmbeddedJavaScript } = require("../extends/embedded-javascript");

const escapeString = (str) => {
  return str.replace(/\\/g, "\\\\");
};

class JISPParser extends EmbeddedActionsParser {
  constructor() {
    super(Object.values(AllTokens));

    const $ = this;

    $.RULE("parse", () => {
      let result = undefined;
      $.OR([
        {
          ALT: () => {
            result = $.SUBRULE($.nil);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.boolean);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.symbol);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.keyword);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.decimalNumber);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.string);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.typehint);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.embeddedJs);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.list);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.map);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.quoteNext);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.quasiQuoteNext);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.spliceUnquoteNext);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.unquoteNext);
          },
        },
        {
          ALT: () => {
            result = $.SUBRULE($.collapseRest);
          },
        },
      ]);
      return result;
    });

    $.RULE("nil", () => {
      $.CONSUME(Tokens.Nil);
      return null;
    });

    $.RULE("boolean", () => {
      const data = $.CONSUME(Tokens.Boolean).image;
      return data === "true";
    });

    $.RULE("symbol", () => {
      const data = $.CONSUME(Tokens.Symbol).image;
      return Symbol.for(data);
    });

    $.RULE("keyword", () => {
      const data = $.CONSUME(Tokens.Keyword).image;
      return Symbol.for(`$__keyword__$${data}`);
    });

    $.RULE("typehint", () => {
      const data = $.CONSUME(Tokens.TypeHint).image;
      return Typehint(data.substring(1));
    });

    $.RULE("decimalNumber", () => {
      const data = $.CONSUME(Tokens.DecimalNumber).image;
      return parseFloat(data);
    });

    $.RULE("string", () => {
      const data = $.CONSUME(Tokens.String).image;
      return data.substring(1, data.length - 1).replace(/\\"/g, '"');
    });

    $.RULE("embeddedJs", () => {
      const data = $.CONSUME(Tokens.EmbeddedJavaScript).image;
      return EmbeddedJavaScript(
        escapeString(data.substring(4, data.length - 1).trim())
      );
    });

    $.RULE("list", () => {
      const items = [];
      $.CONSUME(Tokens.ListOpen);
      $.MANY(() => {
        const x = $.SUBRULE($.parse);
        items.push(x);
      });
      $.CONSUME(Tokens.ListClose);
      return items;
    });

    $.RULE("map", () => {
      $.CONSUME(Tokens.MapOpen);
      const entries = [];
      $.MANY(() => {
        let key;
        $.OR([
          {
            ALT: () => {
              key = $.SUBRULE($.symbol);
            },
          },
          {
            ALT: () => {
              key = $.SUBRULE($.keyword);
            },
          },
          {
            ALT: () => {
              key = $.SUBRULE($.string);
            },
          },
        ]);
        const value = $.SUBRULE($.parse);
        entries.push([key, value]);
      });
      $.CONSUME(Tokens.MapClose);
      return Object.fromEntries(entries);
    });

    $.RULE("quoteNext", () => {
      $.CONSUME(Tokens.QuoteNext);
      const nextForm = $.SUBRULE($.parse);
      return [Symbol.for("quote"), nextForm];
    });

    $.RULE("quasiQuoteNext", () => {
      $.CONSUME(Tokens.QuasiQuoteNext);
      const nextForm = $.SUBRULE($.parse);
      return [Symbol.for("quasiquote"), nextForm];
    });

    $.RULE("unquoteNext", () => {
      $.CONSUME(Tokens.UnquoteNext);
      const nextForm = $.SUBRULE($.parse);
      return [Symbol.for("unquote"), nextForm];
    });

    $.RULE("spliceUnquoteNext", () => {
      $.CONSUME(Tokens.SpliceUnquoteNext);
      const nextForm = $.SUBRULE($.parse);
      return [Symbol.for("splice-unquote"), nextForm];
    });

    $.RULE("collapseRest", () => {
      $.CONSUME(Tokens.CollapseRest);
      const data = $.CONSUME(Tokens.Symbol).image;
      return Symbol.for(`$__collapse_rest__$${data}`);
    });

    this.performSelfAnalysis();
  }
}

module.exports = {
  JISPParser,
};
