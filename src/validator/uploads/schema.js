// schema.js
const Joi = require('joi');

const uploadPayloadSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.base': 'Judul harus berupa teks',
    'any.required': 'Judul wajib diisi',
  }),
  file: Joi.any().required().messages({
    'any.required': 'File wajib diunggah',
  }),
});

module.exports = { uploadPayloadSchema };
