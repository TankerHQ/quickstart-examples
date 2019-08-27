// @flow
const os = require('os');

const findIPv4 = (nameRegExp = /.*/) => {
  const defs = os.networkInterfaces();
  const names = Object.keys(defs).filter((name) => nameRegExp.test(name)).sort();
  const match = names
    .reduce((acc, name) => acc.concat(defs[name]), [])
    .find((def) => def.family === 'IPv4');
  return match && match.address;
};

const getLoopbackIP = () => findIPv4(/^lo/);

const privateIPRegExp = /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/;

const getLocalNetworkIP = () => {
  const candidate = findIPv4(/^(en|eth)/);
  if (candidate && privateIPRegExp.test(candidate)) {
    return candidate;
  }
  return undefined;
};

const getDemoIP = () => getLocalNetworkIP() || getLoopbackIP() || '127.0.0.1';

module.exports = {
  getDemoIP,
};
