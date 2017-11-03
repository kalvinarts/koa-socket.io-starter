const Router = require('koa-router');
const router = new Router();

const modules = {
  user: require('./user'),
};

Object.keys(modules)
.forEach(name => router.use(`/${name}`, modules[name].routes()));

module.exports = router;