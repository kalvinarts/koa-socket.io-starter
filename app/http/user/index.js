const Router = require('koa-router');
const user = require('./user');
const router = new Router();

router
.get('/', user.isLoggedIn, user.user)
.post('/logout', user.logout)
.post('/login', user.login);

module.exports = router;
