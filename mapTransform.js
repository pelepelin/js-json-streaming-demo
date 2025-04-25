const { Transform } = require("stream");

exports.mapTransform = (transform) =>
  new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform(obj, encoding, callback) {
      this.push(transform(obj));
      callback();
    },
  });
