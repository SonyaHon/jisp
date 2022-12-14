class Context {
  constructor(parentContext = null) {
    this.parentContext = parentContext;
    this.storage = {};
  }

  set(sym, value) {
    this.storage[sym] = value;
  }

  setParent(parent) {
    this.parentContext = parent;
  }

  get(sym) {
    const item = this.storage[sym];
    if (item === undefined) {
      if (this.parentContext) {
        return this.parentContext.get(sym);
      }
      return null;
    }
    return item;
  }

  copyStorage(anotherContext) {
    for (const binding of Object.getOwnPropertySymbols(
      anotherContext.storage
    )) {
      this.storage[binding] = anotherContext.storage[binding];
    }
  }
}

module.exports = {
  Context,
};
