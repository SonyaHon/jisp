function isKeyword(data) {
  return (
    typeof data === "symbol" && data.description.startsWith("$__keyword__$:")
  );
}

function keywordFor(data, keyword) {
  return data === Symbol.for(`$__keyword__$${keyword}`);
}

module.exports = {
  isKeyword,
  keywordFor,
};
