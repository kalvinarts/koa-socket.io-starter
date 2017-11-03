const package = require('../package.json');

module.exports = {
  package,
  env: {
    DEBUG: `koa,koa:*,${package.name},${package.name}:*`,
    NODE_PORT: 4000,
    NODE_SECRET: 'ik*^2f8q*hXbTzCt^EzkoaWv5h9TZhQI'
  },
}