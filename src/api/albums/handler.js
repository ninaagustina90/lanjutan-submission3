const { AlbumValidator } = require('../../validator/albums');

class AlbumsHandler {
  constructor(service, validator = AlbumValidator) {
    this._service = service;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    try {
      this._validator.validateAlbumPayload(request.payload);

      const { name, year } = request.payload;
      const albumId = await this._service.addAlbum({ name, year });

      return h.response({
        status: 'success',
        message: 'Album successfully added',
        data: { albumId },
      }).code(201);
    } catch (error) {
      return h.response({
        status: 'fail',
        message: error.message,
      }).code(400);
    }
  }

  async getAlbumByIdHandler(request, h) {
    try {
      const { id } = request.params;

      const [album, songs] = await Promise.all([
        this._service.getAlbumById(id),
        this._service.getSongsByAlbumId(id),
      ]);

      return h.response({
        status: 'success',
        data: {
          album: {
            ...album,
            songs,
          },
        },
      }).code(200);
    } catch (error) {
      return h.response({
        status: 'fail',
        message: error.message,
      }).code(404);
    }
  }

  async putAlbumByIdHandler(request, h) {
    try {
      this._validator.validateAlbumPayload(request.payload);

      const { id } = request.params;
      const { name, year } = request.payload;

      await this._service.editAlbumById(id, { name, year });

      return h.response({
        status: 'success',
        message: 'Album successfully updated',
      }).code(200);
    } catch (error) {
      return h.response({
        status: 'fail',
        message: error.message,
      }).code(error.statusCode);
    }
  }

  async deleteAlbumByIdHandler(request, h) {
    try {
      const { id } = request.params;

      await this._service.deleteAlbumById(id);

      return h.response({
        status: 'success',
        message: 'Album successfully deleted',
      }).code(200);
    } catch (error) {
      return h.response({
        status: 'fail',
        message: error.message,
      }).code(404);
    }
  }
}

module.exports = AlbumsHandler;
