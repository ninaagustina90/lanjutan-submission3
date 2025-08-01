const ClientError = require('../../exceptions/clientError');
const autoBind = require('auto-bind').default;

class UploadsHandler {
  constructor(service, validator, albumsService) {
    this._service = service;
    this._validator = validator;
    this._albumsService = albumsService;

    autoBind(this);
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    const {id} = request.params;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._service.writeFile(cover, cover.hapi);
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;
    console.log(coverUrl);
    await this._albumsService.addAlbumCoverById(id, coverUrl);
    return h
      .response({
        status: 'success',
        message: 'Gambar berhasil diunggah',
        data: { filename },
      })
      .code(201);
  }
}

module.exports = UploadsHandler;