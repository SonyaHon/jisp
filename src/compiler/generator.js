const { isEmbeddedJavascript } = require("../extends/embedded-javascript");

function generateJs(data) {
  if (Array.isArray(data)) {
    return `[
      ${data
        .map((form) => {
          return generateJs(form);
        })
        .join(", ")}
    ]`;
  }

  if (typeof data === "object") {
    if (isEmbeddedJavascript(data)) {
      return data.serialize();
    }
  }

  if (typeof data === "symbol") {
    return `Symbol.for('${data.description}')`;
  }

  if (typeof data === "string") {
    return `\`${data}\``;
  }

  return `${data}`;
}

module.exports = {
  generateJs,
};
