const { Transform } = require("stream");

exports.limiterTransform = (maxObjects, stopReading) => {
  let objectCount = 0;
  return new Transform({
    objectMode: true,

    transform(chunk, encoding, callback) {
      objectCount++;
      if (objectCount <= maxObjects) {
        this.push(chunk);
        if (objectCount === maxObjects) {
          stopReading();
          this.push(null); // Signal end of data
        }
      }
      callback();
    },
  });
};
