class EmbeddedJavaScript {
  constructor(jsCode) {
    this.jsCode = jsCode;
  }

  getJsCode() {
    const code = this.jsCode
      .replace(/(?<!\\)@@([-\w$?+/*!><|&\.]+)/g, function (_, arg) {
        return `(this.get(Symbol.for('${arg}')))`;
      })
      .replace(/(?<!\\)@(\d)/g, function (_, arg) {
        return `arguments[${arg}]`;
      })
      .replace(/(?<!\\)~@/g, "([...arguments])");
    return code;
  }

  serialize() {
    return `(__embeddedjavascript$(\`${this.jsCode}\`))`;
  }
}

module.exports = {
  EmbeddedJavaScript: function (jsCode) {
    return new EmbeddedJavaScript(jsCode);
  },
  isEmbeddedJavascript: function (form) {
    return typeof form === "object" && form instanceof EmbeddedJavaScript;
  },
};
