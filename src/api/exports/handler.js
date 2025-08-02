const ClientError = require('../../exceptions/clientError');

class ExportsHandler {
  constructor(service, validator, playlistsService) {
    this._service = service;
    this._validator = validator;
    this._playlistsService = playlistsService;

    this.postExportHandler = this.postExportHandler.bind(this);
  }

  async postExportHandler(request, h) {
    this._validator.validateExportPlaylistPayload(request.payload);

    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    
await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);

    const message = {
        playlistId,
        targetEmail: request.payload.targetEmail,
};
await this._service.sendMessage('export:playlists', JSON.stringify(message));
    return h.response({
      status: 'success',
      message: 'Permintaan export berhasil dikirim',
    }).code(201);
  }
}

module.exports = ExportsHandler;