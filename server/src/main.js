const cli = require('commander');
const path = require('path');

const { getConfig } = require('./config');
const server = require('./server');
const log = require('./log');

const port = 8080;
const dataPath = path.resolve(__dirname, '../data').normalize();

cli.option('-c, --config <c>', 'A Tanker JSON config file').parse(process.argv);

getConfig(cli.config).then(async (config) => {
  if (!config) return;

  await server.setup({ ...config, dataPath });

  log('Tanker mock server:');
  log(`Configured with Trustchain: ${config.trustchainId}`, 1);
  log(`Listening on http://localhost:${port}/`, 1);

  server.listen(port);
}).catch(error => console.error(error));
