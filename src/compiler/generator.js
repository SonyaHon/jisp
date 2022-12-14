const { isEmbeddedJavascript } = require("../extends/embedded-javascript");

function genUniqueVarName() {
  let result = "dVar_";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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

function generateImports(data) {
  let imports = "";
  let importBindings = "";
  let restData = [...data];

  for (let i = restData.length - 1; i >= 0; i--) {
    let elem = restData[i];

    if (Array.isArray(elem) && elem[0] === Symbol.for("use")) {
      restData.splice(i, 1);
      const importPath = elem[1];
      const importId = genUniqueVarName();
      imports += `const ${importId} = require('${importPath}');\n`;
      importBindings += `ctx.copyStorage(await ${importId}());\n`;
    }

    if (Array.isArray(elem) && elem[0] === Symbol.for("import")) {
      restData.splice(i, 1);
      const importClauses = elem.slice(1);
      for (const importClause of importClauses) {
        const [importPath, asOrRefer, bindSymbolOrBindings] = importClause;
        if (asOrRefer === Symbol.for("$__keyword__$:as")) {
          imports += `__globalContext.set(Symbol.for('${bindSymbolOrBindings.description}'), require('${importPath}'));\n`;
        } else if (asOrRefer === Symbol.for("$__keyword__$:refer")) {
          const importId = genUniqueVarName();
          imports += `const ${importId} = require('${importPath}');\n`;
          for (const bindingSymbol of bindSymbolOrBindings) {
            importBindings += `ctx.set(Symbol.for('${bindingSymbol.description}'), (await ${importId}()).get(Symbol.for('${bindingSymbol.description}')));\n`;
          }
        }
      }
    }
  }

  return { imports, importBindings, restData };
}

module.exports = {
  generateJs,
  generateImports,
};
