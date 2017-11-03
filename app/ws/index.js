const modules = {
  hello: require('./user'),
}

module.exports = io => {
  // Attach modules to the socket
  io.on('connection', socket => {
    Object.keys(modules)
    .forEach(name => modules[name](socket));
  });
};
