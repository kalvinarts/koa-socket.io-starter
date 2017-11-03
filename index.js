// Get the config
const config = require('./config');

// Setup environment (real environment vars take precedence over ones on config)
process.env = Object.assign({}, config.env, process.env);

// Require deps
const debug = require('debug')(config.package.name);
const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const static = require('koa-static');
const cors = require('@koa/cors');
const session = require('koa-session');
const MemoryStore = require('koa-session-memory');
const bodyparser = require('koa-bodyparser');
const socketIO = require('socket.io');
const cookie = require('cookie');

// Get the APIs
const apis = require('./app');

// Initialize the application
const app = new Koa();

// Setup the application shared context
const context = {};
app.context.config = config;
app.context.debug = debug;

// Setup the session module
const sessionStore = new MemoryStore();
app.keys = [ process.env.NODE_SECRET ];
app.use(session({
  key: `${config.package.name}:sess`,
  maxAge: 86400000,
  // By default use a memory storage
  store: sessionStore,
}, app));

// Setup cors
app.use (cors());

// Setup static file server
app.use(static('public'));

// Setup bodyparser
app.use(bodyparser());

// Setup the logger
app.use(async (ctx, next) => {
  const { method, path } = ctx.request;
  const start = new Date();
  await next();
  const ms = new Date() - start;
  debug(method, path, `${ms}ms`);
});

// Setup error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500,
    ctx.body = { status: false, error: error.message };
    ctx.app.emit('error', error);
  }
})

// Setup http api
const apiRouter = new Router();
apiRouter.use('/api', apis.http.routes());
app.use(apiRouter.routes());

// Initialize the http server
const server = http.createServer(app.callback());

// Initialize the socket.io server
app.io = socketIO(server);

// Setup a shared session for the socket.io server
app.io.use((socket, next) => {
  (async () =>{
    // Setup session
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    const sid = cookies[`${config.package.name}:sess`];
    const session = sessionStore.get(sid);
    socket.session = session || {};
    
    // Attach the sessions store (this allows to save sessions)
    socket.sessions = sessionStore;
    
    // Update the session every time it changes
    // WARNING this feature is only known to work with the koa-session-memory module
    if (sessionStore.on) sessionStore.on('changed', ({key, session}) => socket.session = session);

    // Attach the app
    socket.app = app;

    next();
  })();
  
});

// Setup the socket.io api
apis.ws(app.io);

// Start listening
server.listen(process.env.NODE_PORT, () => {
  debug(`App listening on port ${process.env.NODE_PORT}`);
});
