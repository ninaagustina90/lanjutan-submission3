const routes = require('./routes');
const AlbumsHandler = require('./handler');

const albumsPlugin = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const handler = new AlbumsHandler(service, validator);
    server.route(routes(handler));
  },
};

module.exports = albumsPlugin;
