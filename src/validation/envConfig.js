import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    env_key: Joi.string()
      .regex(/^[A-Z0-9_]+$/)
      .required()
      .messages({
        "string.pattern.base":
          "env_key must only contain capital letters, numbers, and underscores",
      }),
    env_value: Joi.string().required().trim().allow(""),
    env_key_description: Joi.string().optional().allow("", null),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.number(),
    env_value: Joi.string().trim(),
    env_key_description: Joi.string().optional().allow("", null),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const genSetting = (data) => {
  const schema = Joi.object({
    CO_SHORT_NAME: Joi.string().required().trim(),
    CO_FULL_NAME: Joi.string().required().trim(),
    CO_ADD_1: Joi.string().required().trim(),
    CO_ADD_2: Joi.string().required().trim(),
    CO_COUNTRY: Joi.string().required().trim(),
    CO_STATE: Joi.string().required().trim(),
    CO_URL: Joi.string().required().trim(),
    CO_PIN: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  genSetting,
};
