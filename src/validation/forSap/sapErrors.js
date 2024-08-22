import Joi from "joi";

const insertSapError = Joi.object({
  uniqueId:Joi.string().required(),
  error_type:Joi.string().required().valid('gis','grns','ses','invoice'),
  errors:Joi.array().required(),
})

const viewSapError = Joi.object({
  uniqueId:Joi.string().required(),
})

export default {
  insertSapError,
  viewSapError
}