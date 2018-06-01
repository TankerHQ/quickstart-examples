const port = 8080;

const path = require('path');

const config = require('./config');
const server = require('./server');
const log = require('./log');

const dataPath = path.resolve(__dirname , '../data').normalize();

server.setup({ dataPath });

log('Tanker mock server:');
log(`Configured with Trustchain: ${config.trustchainId}`, 1);
log(`Listening on http://localhost:${port}/`, 1);


server.listen(port);
