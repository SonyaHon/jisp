function isKeyword(data) {
  return (
    typeof data === "symbol" && data.description.startsWith("$__keyword__$:")
  );
}

module.exports = {
  isKeyword,
};
