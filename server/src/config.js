const fs = require('fs');
const pathLib = require('path');
const selectShell = require('select-shell');

const configDir = pathLib.join(__dirname, '..', '..', 'config');

const listConfigFileNames = () => fs.readdirSync(configDir).filter((f) => f.match(/\.json$/));

const readJSONFile = (filePath) => JSON.parse(fs.readFileSync(filePath));

const readConfigFile = (fileName) => {
  const filePath = pathLib.join(configDir, fileName);
  return readJSONFile(filePath);
};

const expandPath = (filePath) => {
  if (filePath[0] === '/') return filePath;
  return pathLib.join(__dirname, '..', '..', filePath);
};

const printMissingConfigMessage = () => {
  console.log([
    'Welcome to the Tanker quickstart examples project.',
    '\nTo run the example server and applications, you need to:',
    '  - create an app on the Tanker dashboard (https://dashboard.tanker.io)',
    '  - download the JSON configuration file of this app',
    '  - move this JSON configuration file under the config/ folder of this project',
    '\nThen, you\'ll be ready to re-run your command.',
  ].join('\n'));
};

const createFilePicker = (fileNames) => {
  const picker = selectShell({ multiSelect: false });
  fileNames.forEach((fileName) => picker.option(fileName));
  console.log('Please select a config file:');
  picker.list();
  return picker;
};

const selectConfig = (configFileNames) => {
  const picker = createFilePicker(configFileNames);

  return new Promise((resolve) => {
    picker.on('select', (choices) => {
      const configFileName = choices[0].value;
      const config = readConfigFile(configFileName);
      resolve(config);
    });
  });
};

const getConfig = async (path) => {
  if (path) {
    return readJSONFile(expandPath(path));
  }

  const configFileNames = listConfigFileNames();

  switch (configFileNames.length) {
    case 0:
      printMissingConfigMessage();
      return null;
    case 1:
      return readConfigFile(configFileNames[0]);
    default:
      return selectConfig(configFileNames);
  }
};

module.exports = {
  getConfig,
};
