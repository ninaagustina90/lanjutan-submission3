require('dotenv').config();
const path = require('path');
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert'); // ✅ Import Inert plugin
const ClientError = require('./exceptions/clientError');

// Plugins
const albums = require('./api/albums');
const songs = require('./api/songs');
const users = require('./api/users');
const playlists = require('./api/playlists');
const authentications = require('./api/authentications');
const collaborations = require('./api/collaborations');
const _exports = require('./api/exports');
const uploads = require('./api/uploads');
const albumsLikes = require('./api/albumsLike');

// Services
const AlbumsService = require('./services/postgres/AlbumsService');
const SongsService = require('./services/postgres/SongsService');
const UsersService = require('./services/postgres/UsersService');
const PlaylistsService = require('./services/postgres/PlaylistsServices');
const AuthenticationsService = require('./services/postgres/AuthService');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const ProducerService = require('./services/rabbitmq/ProducerService');
const StorageService = require('./services/storage/StorageService');
const AlbumLikesService = require('./services/postgres/AlbumsLikesService');
const CacheService = require('./services/redis/CacheService');

// Validators
const AlbumsValidator = require('./validator/albums');
const SongsValidator = require('./validator/songs');
const UsersValidator = require('./validator/users');
const PlaylistsValidator = require('./validator/playlists');
const AuthenticationsValidator = require('./validator/authentications');
const CollaborationsValidator = require('./validator/collaborations');
const ExportsValidator = require('./validator/exports');
const UploadsValidator = require('./validator/uploads');

const TokenManager = require('./tokenize/TokenManager');

const init = async () => {
  const collaborationsService = new CollaborationsService();
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const usersService = new UsersService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const authenticationsService = new AuthenticationsService();
  const storageService = new StorageService(path.resolve(__dirname, 'api/uploads/file/images'));
  const albumsLikesService = new AlbumLikesService();
  const cacheService = new CacheService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: { origin: ['*'] },
    },
  });

  await server.register(Jwt);
  await server.register(Inert); // ✅ Proper registration inside init()

  server.auth.strategy('openmusicapp_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY || 'default_key_fallback',
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: parseInt(process.env.ACCESS_TOKEN_AGE, 10) || 14400,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: { id: artifacts.decoded.payload.id },
    }),
  });

  await server.register([
    { plugin: albums, options: { service: albumsService, validator: AlbumsValidator } },
    { plugin: songs, options: { service: songsService, validator: SongsValidator } },
    { plugin: users, options: { service: usersService, validator: UsersValidator } },
    {
      plugin: playlists,
      options: {
        playlistsService,
        songsService,
        validator: {
          validatePlaylistPayload: PlaylistsValidator.validatePlaylistPayload,
          validateSongPlaylistPayload: PlaylistsValidator.validateSongPlaylistPayload,
        },
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        service: ProducerService,
        validator: ExportsValidator,
        playlistsService,
      },
    },
    {
      plugin: uploads,
      options: {
        service: storageService,
        validator: UploadsValidator,
        albumsService,
      },
    },
    {
      plugin: albumsLikes,
      options: {
        service: albumsLikesService,
        albumsService,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        return h.response({
          status: 'fail',
          message: response.message,
        }).code(response.statusCode);
      }

      if (!response.isServer) return h.continue;

      return h.response({
        status: 'error',
        message: 'Terjadi kegagalan pada server kami',
      }).code(500);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan di ${server.info.uri}`);
};

init();
