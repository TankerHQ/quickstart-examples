const path = require('path');
const { getWebpackConfig } = require('../../config/webpack.config.base');

const rootPath = path.resolve(__dirname, '..');

module.exports = getWebpackConfig(rootPath);
