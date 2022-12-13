const EventEmitter = require("events");
const moduleEvents = new EventEmitter();

const __eval$ = require("__EVALUATOR__").evaluate;
const __context$ = require("__CONTEXT__").Context;
const __globalContext = require("__GLOBAL_CONTEXT__");
const __embeddedjavascript$ = require("__EMBEDDED_JS__").EmbeddedJavaScript;

const ctx = new __context$();
let moduleLoaded = false;

(async () => {
  ctx.setParent(await __globalContext());
  await __eval$(__$GENERATED$__, ctx);
  moduleLoaded = true;
  moduleEvents.emit("loaded");
})();

module.exports = {
  __isJispModule: true,
  getNsContext: async function () {
    if (moduleLoaded) {
      return ctx;
    }
    return await new Promise((resolve) => {
      moduleEvents.once("loaded", () => {
        resolve(ctx);
      });
    });
  },
};
