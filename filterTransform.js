const { Transform } = require("stream");

exports.filterTransform = (predicate) =>
  new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform(obj, encoding, callback) {
      if (predicate(obj)) {
        this.push(obj);
      }
      callback();
    },
  });
