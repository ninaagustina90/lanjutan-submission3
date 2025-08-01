const routes = require('./routes');
const AuthenticationsHandler = require('./handler');

module.exports = {
  name: 'authentications',
  version: '1.0.0',
  register: async (server, { authenticationsService, usersService, tokenManager, validator }) => {
    const handler = new AuthenticationsHandler(
      authenticationsService,
      usersService,
      tokenManager,
      validator
    );

    server.route(routes(handler));
  },
};
