// Pretty logger
//  - add timestamps
//  - allow to indent logged messages
const log = (message, indentLevel = 0) => {
  const date = (new Date()).toISOString().slice(11, 19);
  const tabSize = 4;
  const prefix = indentLevel ? new Array(indentLevel * tabSize - 1).join(' ') + '- ' : '';

  if (indentLevel === 0) console.log(''); // skip line

  if (message instanceof Error) {
    console.log('[' + date + ']', prefix + 'A server-side error occurred'); // eslint-disable-line no-console
    console.error(message); // eslint-disable-line no-console
  } else {
    console.log('[' + date + ']', prefix + message); // eslint-disable-line no-console
  }
};

module.exports = log;
