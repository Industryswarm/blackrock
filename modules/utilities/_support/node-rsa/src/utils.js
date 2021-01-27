/*
 * Utils functions
 *
 */

const crypt = require('crypto');

module.exports.linebrk = function(str, maxLen) {
  let res = '';
  let i = 0;
  while (i + maxLen < str.length) {
    res += str.substring(i, i + maxLen) + '\n';
    i += maxLen;
  }
  return res + str.substring(i, str.length);
};

module.exports.detectEnvironment = function() {
  if (typeof(window) !== 'undefined' && window && !(process && process.title === 'node')) {
    return 'browser';
  }

  return 'node';
};

module.exports.get32IntFromBuffer = function(buffer, offset) {
  offset = offset || 0;
  let size = 0;
  if ((size = buffer.length - offset) > 0) {
    if (size >= 4) {
      return buffer.readUInt32BE(offset);
    } else {
      let res = 0;
      for (let i = offset + size, d = 0; i > offset; i--, d += 2) {
        res += buffer[i - 1] * Math.pow(16, d);
      }
      return res;
    }
  } else {
    return NaN;
  }
};

module.exports._ = {
  isObject: function(value) {
    const type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  },

  isString: function(value) {
    return typeof value == 'string' || value instanceof String;
  },

  isNumber: function(value) {
    return typeof value == 'number' || !isNaN(parseFloat(value)) && isFinite(value);
  },

  omit: function(obj, removeProp) {
    const newObj = {};
    for (const prop in obj) {
      if (!obj.hasOwnProperty(prop) || prop === removeProp) {
        continue;
      }
      newObj[prop] = obj[prop];
    }

    return newObj;
  },
};

module.exports.trimSurroundingText = function(data, opening, closing) {
  let trimStartIndex = 0;
  let trimEndIndex = data.length;

  const openingBoundaryIndex = data.indexOf(opening);
  if (openingBoundaryIndex >= 0) {
    trimStartIndex = openingBoundaryIndex + opening.length;
  }

  const closingBoundaryIndex = data.indexOf(closing, openingBoundaryIndex);
  if (closingBoundaryIndex >= 0) {
    trimEndIndex = closingBoundaryIndex;
  }

  return data.substring(trimStartIndex, trimEndIndex);
};
