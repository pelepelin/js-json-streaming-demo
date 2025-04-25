const { Transform } = require("stream");

exports.peekTransform = (consumer) =>
  new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform(obj, encoding, callback) {
      this.push(obj);
      try {
        consumer(obj);
      } finally {
        callback();
      }
    },
  });
