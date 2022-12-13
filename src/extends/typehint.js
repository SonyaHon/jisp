class Typehint {
  constructor(type) {
    this.type = type;
  }

  toString() {
    return `Typehint(${this.type})`;
  }
}

module.exports = {
  Typehint: function (type) {
    return new Typehint(type);
  },
};
