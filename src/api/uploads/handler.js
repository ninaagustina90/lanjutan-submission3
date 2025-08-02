const ClientError = require('../../exceptions/clientError');
const autoBind = require('auto-bind').default;

class UploadsHandler {
  constructor(service, validator, albumsService) {
    this._service = service;
    this._validator = validator;
    this._albumsService = albumsService;

    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
  }

 async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;
    this._validator.validateUploadPayload(cover.hapi.headers);
    try {
      const filename = await this._service.writeFile(cover, cover.hapi);
      const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/${id}/images/${filename}`;
      console.log(coverUrl);
      await this._albumsService.addCoverAlbumById(id, coverUrl);
      const response = h.response({
        status: "success",
        message: "Sampul berhasil diunggah",
        data: {
          coverUrl: coverUrl,
        },
      });
      response.code(201);
      return response;
    } catch (err) {
      return h
        .response({
          status: "fail",
          message: err.message,
        })
        .code(500);
    }
  }
}

module.exports = UploadsHandler;