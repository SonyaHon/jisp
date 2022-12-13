const { isKeyword } = require("../extends/keyword");
const { isEmbeddedJavascript } = require("../extends/embedded-javascript");
const { Context } = require("../context");
const AsyncFunction = async function () {}.constructor;

async function evaluateForm(form, context) {
  while (true) {
    if (Array.isArray(form)) {
      if (form.length === 0) {
        return form;
      }

      const maybeSpecialForm = form[0];

      if (maybeSpecialForm === Symbol.for("def!")) {
        const key = form[1];
        if (typeof key !== "symbol" || isKeyword(key)) {
          throw new Error("First argument of a do form must be a symbol");
        }
        const value = form[2];
        const evaluatedValue = await evaluateForm(value, context);
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
          bindings.forEach((binding, index) => {
            nContext.set(binding, args[index]);
          });
          return await evaluateForm(body, nContext);
        };
      }

      const evaluatedList = await evaluateItem(form, context);
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
      if (form === null) {
        return form;
      }

      if (isEmbeddedJavascript(form)) {
        return new AsyncFunction(form.getJsCode()).bind(context);
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
