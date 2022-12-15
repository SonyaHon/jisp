const { isKeyword, keywordFor } = require("../extends/keyword");
const { isEmbeddedJavascript } = require("../extends/embedded-javascript");
const { Context } = require("../context");
const { read } = require("../reader");

const AsyncFunction = async function () {}.constructor;

let fs;
fs = require("node:fs/promises");

function quasiquote(ast) {
  if (Array.isArray(ast)) {
    if (ast[0] === Symbol.for("unquote")) {
      return ast[1];
    }
    let result = [];
    for (let x = ast.length - 1; x >= 0; x--) {
      const elt = ast[x];
      if (Array.isArray(elt) && elt[0] === Symbol.for("splice-unquote")) {
        result = [Symbol.for("concat"), elt[1], result];
      } else {
        result = [Symbol.for("cons"), quasiquote(elt), result];
      }
    }
    return result;
  }
  return [Symbol.for("quote"), ast];
}

function isMacroCall(form, context) {
  return (
    Array.isArray(form) &&
    typeof form[0] === "symbol" &&
    context.get(form[0])?.isMacro === true
  );
}

async function macroExpand(form, context) {
  while (isMacroCall(form, context)) {
    const fn = context.get(form[0]);
    form = await fn(...form.slice(1));
  }
  return form;
}

async function evaluateForm(form, context) {
  while (true) {
    if (Array.isArray(form)) {
      if (form.length === 0) {
        return form;
      }

      form = await macroExpand(form, context);
      if (!Array.isArray(form)) {
        return form;
      }

      const maybeSpecialForm = form[0];

      if (
        typeof maybeSpecialForm === "symbol" &&
        maybeSpecialForm.description.match(
          /.+\/.+/
        )
      ) {
        symbols = maybeSpecialForm.description
          .split("/")
          .map((part) => Symbol.for(part));
        const ctx = await (await evaluateItem(symbols[0], context))();
        const value = await evaluateItem(symbols[1], ctx);

        form[0] = value;
      }

      if (maybeSpecialForm === Symbol.for(".")) {
        const prop = form[1].description;
        const obj = await evaluateForm(form[2], context);
        return obj[prop];
      }

      if (maybeSpecialForm === Symbol.for("macroexpand")) {
        return await macroExpand(await evaluateForm(form[1], context), context);
      }

      if (maybeSpecialForm === Symbol.for("import")) {
        const importClauses = form.slice(1);

        for (const importClause of importClauses) {
          const [filePath, kw, bindingsOrBinding] = importClause;
          const nsContext = new Context(context.parentContext);

          await evaluateForm(
            read(`(do ${await fs.readFile(filePath)} nil)`),
            nsContext
          );
          if (keywordFor(kw, ":as")) {
            context.set(bindingsOrBinding, async () => nsContext);
          } else if (keywordFor(kw, ":refer")) {
            for (const binding of bindingsOrBinding) {
              context.set(binding, nsContext.get(binding));
            }
          } else {
            throw new Error("Only :as or :refer are usable in import form");
          }
        }
        return null;
      }

      if (maybeSpecialForm === Symbol.for("use")) {
        const path = form[1];
        await evaluateForm(
          read(`(do ${await fs.readFile(path)} nil)`),
          context
        );
        return null;
      }

      if (maybeSpecialForm === Symbol.for("def!")) {
        const key = form[1];
        if (typeof key !== "symbol" || isKeyword(key)) {
          throw new Error("First argument of a def! form must be a symbol, got", form);
        }
        const value = form[2];
        const evaluatedValue = await evaluateForm(value, context);
        context.set(key, evaluatedValue);
        return evaluatedValue;
      }

      if (maybeSpecialForm === Symbol.for("defmacro!")) {
        const key = form[1];
        if (typeof key !== "symbol" || isKeyword(key)) {
          throw new Error("First argument of a do form must be a symbol");
        }
        const value = form[2];
        const evaluatedValue = await evaluateForm(value, context);
        evaluatedValue.isMacro = true;
        context.set(key, evaluatedValue);
        return evaluatedValue;
      }

      if (maybeSpecialForm === Symbol.for("let*")) {
        const bindings = form[1];
        const body = form[2];

        const nContext = new Context(context);
        for (let i = 0; i < bindings.length; i += 2) {
          const key = bindings[i];
          const value = await evaluateForm(bindings[i + 1], nContext);
          nContext.set(key, value);
        }

        form = body;
        context = nContext;
        continue;
      }

      if (maybeSpecialForm === Symbol.for("if")) {
        const cond = form[1];
        const trueBranch = form[2];
        const falseBranch = form[3];

        const evaluatedCond = await evaluateForm(cond, context);
        const isFalsy =
          evaluatedCond === false ||
          evaluatedCond === null ||
          evaluatedCond === undefined;
        form = isFalsy ? falseBranch : trueBranch;
        continue;
      }

      if (maybeSpecialForm === Symbol.for("do")) {
        const rest = form.slice(1, form.length - 1);
        const last = form[form.length - 1];
        for (const f of rest) {
          await evaluateForm(f, context);
        }
        form = last;
        continue;
      }

      if (maybeSpecialForm === Symbol.for("fn*")) {
        let nContext = new Context(context);
        const bindings = form[1];
        const body = form[2];
        return async function (...args) {
          for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            if (binding.description.startsWith("$__collapse_rest__$")) {
              nContext.set(
                Symbol.for(binding.description.substring(19)),
                args.slice(i)
              );
              break;
            } else {
              nContext.set(binding, args[i]);
            }
          }

          return await evaluateForm(body, nContext);
        };
      }

      if (maybeSpecialForm === Symbol.for("quote")) {
        return form[1];
      }

      if (maybeSpecialForm === Symbol.for("quasiquote")) {
        form = quasiquote(form[1]);
        continue;
      }

      const evaluatedList = await evaluateItem(form, context);
      if (typeof evaluatedList[0] !== "function") {
        throw new Error(`${String(form[0])} is not referencing a function`);
      }
      return await evaluatedList[0](...evaluatedList.slice(1));
    }
    return await evaluateItem(form, context);
  }
}

async function evaluateItem(form, context) {
  if (Array.isArray(form)) {
    const items = [];
    for (const item of form) {
      items.push(await evaluateForm(item, context));
    }
    return items;
  }

  switch (typeof form) {
    case "object":
      if (isEmbeddedJavascript(form)) {
        return new AsyncFunction(form.getJsCode()).bind(context);
      }
      if (form === null || !form[Symbol.for('@@jisp-map@@')]) {
        return form;
      }

      const entries = [];

      const keys = [
        ...Object.keys(form),
        ...Object.getOwnPropertySymbols(form),
      ];

      for (const key of keys) {
        if (form.propertyIsEnumerable(key)) {
          const value = form[key];
          entries.push([
            await evaluateItem(key, context, compile),
            await evaluateForm(value, context, compile),
          ]);
        }
      }
      return Object.fromEntries(entries);
      break;
    case "symbol":
      if (isKeyword(form)) {
        return form;
      } else {
        return context.get(form);
      }
      break;
    default:
      return form;
  }
}

module.exports = {
  evaluateForm,
  evaluateItem,
};
