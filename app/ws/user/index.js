module.exports = socket => {
  socket.on('user', msg => {
    if (socket.session.loggedIn)
      socket.emit('user', socket.session.user);
    else
      socket.emit('user', {});
  });
};
