const { log } = require("./logger");
const { app } = require("./app.js");

log("Starting");
const inputFile = "input.json";
const outputFile = "output.json";
const maxObjects = 5000;

log("In: ", inputFile);
log("Out: ", outputFile);

(async () => {
  await app(inputFile, outputFile, maxObjects);
  log("Done");
})();
