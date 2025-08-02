// index.js
const { uploadPayloadSchema } = require('./schema');
const ClientError = require('../../exceptions/clientError');

const UploadValidator = {
  validateUploadPayload: (payload) => {
    const validationResult = uploadPayloadSchema.validate(payload, { abortEarly: false });
    if (validationResult.error) {
      throw new ClientError(validationResult.error.details.map(detail => detail.message).join(', '));
    }
  },
};

module.exports = UploadValidator;
