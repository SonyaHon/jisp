const EventEmitter = require("node:events");
const emitter = new EventEmitter();

const __eval$ = require("__EVALUATOR__").evaluate;
const __context$ = require("__CONTEXT__").Context;
const __globalContext = require("__GLOBAL_CONTEXT__");
const __embeddedjavascript$ = require("__EMBEDDED_JS__").EmbeddedJavaScript;

__$IMPORTS$__

const ctx = new __context$(__globalContext);
let moduleLoaded = false;
(async () => {
  __$IMPORT_BINDINGS$__
  await __eval$(__$GENERATED$__, ctx);
  module.loaded = true;
  emitter.emit("loaded");
})();

module.exports = async () => {
  if (moduleLoaded) {
    return ctx;
  }
  return new Promise((resolve) => {
    emitter.once("loaded", () => {
      resolve(ctx);
    });
  });
};
