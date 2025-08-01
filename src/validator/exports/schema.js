// schema.js
const Joi = require('joi');

const ExportPayloadSchema = Joi.object({
  targetEmail: Joi.string().email({ tlds: true }).required().messages({
    'string.email': 'Format email tidak valid',
    'any.required': 'Email tujuan wajib diisi',
  }),
});

module.exports = { ExportPayloadSchema };
