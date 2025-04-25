const { Transform } = require("stream");

exports.toJsonArrayTransform = () => {
  return new Transform({
    writableObjectMode: true,
    readableObjectMode: false,
    construct(callback) {
      this.first = true;
      this.push("[\n");
      callback();
    },
    transform(chunk, encoding, callback) {
      if (this.first) {
        this.first = false;
      } else {
        this.push(",\n");
      }
      this.push(chunk);
      callback();
    },
    flush(callback) {
      this.push("\n]\n");
      callback();
    },
  });
};
