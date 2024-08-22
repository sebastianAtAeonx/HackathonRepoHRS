import Joi from "joi";

const create = (data) => {
  const joiSchema = Joi.object({
    table_name: Joi.string().required(),
    display_name: Joi.string()
      .required()
      .pattern(/^(?:[A-Z][a-z]*\s?)+$/)
      .messages({
        "string.pattern.base":
          "Display name must be in title case (e.g., 'Title Case').",
      }),
  }).unknown(true);

  return joiSchema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("created_at"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
  }).unknown(true);
  return schema.validate(data);
};

const update = (data) => {
  const JoiSchema = Joi.object({
    id: Joi.number().required().messages({ "any.required": "Id is required" }),
    table_name: Joi.string().required(),
    display_name: Joi.string()
      .required()
      .pattern(/^(?:[A-Z][a-z]*\s?)+$/)
      .messages({
        "string.pattern.base":
          "Display name must be in title case (e.g., 'Title Case').",
      }),
    attachment: Joi.string().allow(""),
  }).unknown(true);

  return JoiSchema.validate(data);
};

const del = (data) => {
  const JoiSchema = Joi.object({
    id: Joi.number().required(),
  }).unknown(false);

  return JoiSchema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
};
