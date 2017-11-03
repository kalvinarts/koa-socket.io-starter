const crypto = require('crypto');

// Ideally user data will come from a database ;)
const users = [
  {
    id: 1,
    name: 'Administrator',
    user: 'admin',
    // We emulate encrypted passwords here
    password: crypto.createHash('sha256')
    .update(`${process.env.NODE_SECRET}::$up3rSecR€t`)
    .digest('hex'),
  },
];

// Setup some error constants
const errors = {
  MissingArguments: [400, 'Missing arguments'],
  InvalidUserOrPassword: [403, 'Invalid user or password'],
  NotLoggedIn: [401, 'LogIn required'],
}

// Define methods and middleware

// Logs a user in
const login = (ctx, next) => {
  const { user, password } = ctx.request.body;
  
  if (!user || !password) return ctx.throw(...errors.MissingArguments);
  
  const u = users.find(u => u.user === user);
  
  if (!u) return ctx.throw(...errors.InvalidUserOrPassword);
  if (
    crypto.createHash('sha256')
    .update(`${process.env.NODE_SECRET}::${password}`)
    .digest('hex')
    !== u.password
  ) return ctx.throw(...errors.InvalidUserOrPassword);
  
  ctx.session.loggedIn = true;
  
  const cleanUser = JSON.parse(JSON.stringify(u));
  delete cleanUser.password;
  
  ctx.session.user = cleanUser;

  ctx.status = 200;
  ctx.body = { status: true, data: cleanUser };
  
  next();
};

// Logs a user out
const logout = (ctx, next) => {
  ctx.session.loggedIn = false;
  ctx.body = { status: true };
  next();
}

// Middleware to check if user is logged in
const isLoggedIn = (ctx, next) => {
  const { session } = ctx;
  if (!ctx.session.loggedIn) return ctx.throw(...errors.NotLoggedIn);
  next();
};

// Returns the user data
const user = (ctx, next) => {
  ctx.status = 200;
  ctx.body = { status: true, data: ctx.session.user };
  next();
};

module.exports = {
  login,
  logout,
  isLoggedIn,
  user,
};
