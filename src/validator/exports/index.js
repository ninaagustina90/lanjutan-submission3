// index.js
const { ExportPayloadSchema } = require('./schema');
const InvariantError = require('../../exceptions/invariantError');

const ExportsValidator = {
  validateExportPlaylistPayload: (payload) => {
    const validationResult = ExportPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = ExportsValidator;
