const autoBind = require('auto-bind').default;
const SongsService = require('../../services/postgres/SongsService');

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this._songService = new SongsService();

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const albumId = await this._service.addAlbum(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: { albumId },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    const songs = await this._songService.getSongsByAlbumId(id);

    album.songs = songs;

    return h.response({
      status: 'success',
      data: { album },
    }).code(200);
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return h.response({
      status: 'success',
      message: 'Album berhasil diperbarui',
    }).code(200);
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    }).code(200);
  }
}

module.exports = AlbumsHandler;
