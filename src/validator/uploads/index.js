// index.js
const { uploadPayloadSchema } = require('./schema');

const UploadValidator = {
  validateUploadPayload: (payload) => {
    const validationResult = uploadPayloadSchema.validate(payload, { abortEarly: false });
    if (validationResult.error) {
      throw new Error(validationResult.error.details.map(detail => detail.message).join(', '));
    }
  },
};

module.exports = UploadValidator;
