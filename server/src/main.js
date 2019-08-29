const cli = require('commander');
const path = require('path');

const { getDemoIP } = require('./ip');

const { getConfig } = require('./config');
const { app, setup } = require('./server');
const log = require('./log');

const port = 8080;
const dataPath = path.resolve(__dirname, '../data').normalize();

cli.option('-c, --config <c>', 'A Tanker JSON config file').parse(process.argv);

getConfig(cli.config).then(async (config) => {
  if (!config) return;

  await setup({ ...config, dataPath });

  log('Tanker mock server:');
  log(`Configured with appId: ${config.appId}`, 1);
  log(`Listening on http://${getDemoIP()}:${port}/`, 1);

  app.listen(port);
}).catch((error) => console.error(error));
