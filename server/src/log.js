const tabSize = 4;

const getPrefix = (indentLevel) => {
  if (indentLevel === 0) {
    return '';
  }

  return new Array((indentLevel * tabSize) - 1).join(' ');
};


// Pretty logger
//  - add timestamps
//  - allow to indent logged messages
const log = (message, indentLevel = 0) => {
  const date = (new Date()).toISOString().slice(11, 19);
  const prefix = getPrefix(indentLevel);

  if (indentLevel === 0) {
    console.log(''); // skip line
  }

  if (message instanceof Error) {
    console.log(`[${date}] ${prefix}: A server-side error occurred:`);
    console.error(message); // eslint-disable-line no-console
  } else {
    console.log(`[${date}] ${prefix}: ${message}`);
  }
};


module.exports = log;
