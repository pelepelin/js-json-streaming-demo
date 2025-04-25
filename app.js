const { peekTransform } = require("./peekTransform");
const { log } = require("./logger");
const { filterObject } = require("./filterObject");
const { transformObject } = require("./transformObject");
const { createReadStream, createWriteStream } = require("fs");
const { pipeline } = require("stream/promises");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray.js");
const { limiterTransform } = require("./limiterTransform.js");
const { toJsonArrayTransform } = require("./toJsonArrayTransform.js");
const { mapTransform } = require("./mapTransform.js");
const { filterTransform } = require("./filterTransform.js");

exports.app = async (inputFile, outputFile, maxObjects) => {
  const abortController = new AbortController();
  let gracefulAbort = false;

  const inputStream = createReadStream(inputFile);
  const outputStream = createWriteStream(outputFile);
  const parserStream = parser();
  outputStream.on("finish", () => {
    if (!inputStream.closed && !inputStream.destroyed) {
      gracefulAbort = true;
      abortController.abort();
    }
  });

  const limiter = limiterTransform(maxObjects, () => {
    // Stop reading new data
    inputStream.pause();
    parserStream.pause();
  });

  const counters = {
    bytesBeforeProcess: 0,
    bytesAfterProcess: 0,
    objectsBeforeProcess: 0,
    objectsAfterProcess: 0,
    startTime: Date.now(),
  };

  const printCounters = () => {
    function formatObjCounter(prefix, count, t) {
      return `${prefix}${count}, at ${((count * 1000) / t).toFixed(0)} obj/s`;
    }

    function formatBytesCounter(prefix, count, t) {
      return `${prefix}${count}, at ${(count / (t * 1000)).toFixed(2)} MB/s`;
    }

    const t = Date.now() - counters.startTime || 1;

    log(formatBytesCounter("Bytes read: ", counters.bytesBeforeProcess, t));
    log(formatBytesCounter("Bytes written: ", counters.bytesAfterProcess, t));
    log(formatObjCounter("Objects read: ", counters.objectsBeforeProcess, t));
    log(formatObjCounter("Objects written: ", counters.objectsAfterProcess, t));
  };

  const streams = [
    inputStream,
    peekTransform((obj) => (counters.bytesBeforeProcess += obj.length)),
    parserStream,
    streamArray(),
    peekTransform(() => (counters.objectsBeforeProcess += 1)),
    // streamArray pushes {key, value} objects, unwrap
    mapTransform(({ value }) => value),
    mapTransform(transformObject),
    filterTransform(filterObject),
    limiter,
    peekTransform(() => (counters.objectsAfterProcess += 1)),
    mapTransform((obj) => JSON.stringify(obj)),
    toJsonArrayTransform(),
    peekTransform((obj) => (counters.bytesAfterProcess += obj.length)),
    outputStream,
  ];

  const pipelinePromise = pipeline(streams, { signal: abortController.signal });

  const printInterval = 2000;
  const intervalHandle = setInterval(printCounters, printInterval);

  try {
    await pipelinePromise;
  } catch (err) {
    // swallow only my own exit
    if (!(err instanceof Error && err.code === "ABORT_ERR" && gracefulAbort)) {
      return Promise.reject(err);
    }
  } finally {
    clearInterval(intervalHandle);
  }

  log("success");
  printCounters();
};
