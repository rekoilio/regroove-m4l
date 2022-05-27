const glob = require("glob");
const Max = require("max-api");

const { CHANNELS } = require("regroovejs");

let DEBUG = true;
const log = (value) => {
  if (DEBUG) {
    Max.post(`${value}`);
  }
};

/**
 * Turns debug on or off.
 * @param {bool} value
 */
Max.addHandler("debug", (value) => {
  if (value === 1) {
    DEBUG = true;
  } else if (value == 0) {
    DEBUG = false;
  }
  debug(`DEBUG: ${DEBUG}`);
});

function validModelDir(dir) {
  const globPath = dir + "*.onnx";
  const valid = glob(globPath, function (err, files) {
    if (err) {
      return false;
    } else {
      if (files.length == 2) {
        return true;
      } else {
        return false;
      }
    }
  });
  return valid;
}

const normalize = (value, min, max) => {
  return (max - min) * value + min;
};

/**
 * Converts a sequence of data as generated by matrixCtrlData into a dictionary
 * format indexed on channel. This is the data structure used by Max to populate
 * the detail view with the correct data for an instrument.
 * @param {List[int]} dataSequence: Sequence of note triplets (step, cannel, value)
 * @param {string} dictName: Name of Max dictionary to write to
 */
const writeDetailViewDict = (dataSequence, dictName) => {
  const newData = {};
  for (let channel = 0; channel < CHANNELS; channel++) {
    newData[channel] = [];
  }

  const numNotes = dataSequence.length / 3;
  for (let i = 0; i < numNotes; i++) {
    const idx = i * 3;
    const channel = dataSequence[idx + 1];
    const value = dataSequence[idx + 2];

    // this assumes steps are incrementing chronologically
    newData[channel].push(value);
  }
  Max.getDict(dictName).then((currentData) => {
    for (const [key, sequence] of Object.entries(newData)) {
      if (sequence === undefined) {
        newData[key] = currentData[key];
      }
    }
    Max.setDict(dictName, newData);
  });
};

module.exports = { log, validModelDir, normalize, writeDetailViewDict };
