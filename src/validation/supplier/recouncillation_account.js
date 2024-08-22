import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    code: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Za-z0-9-]+$/)
      .messages({
        "string.base": "Code must be a string.",
        "string.pattern.base":
          "Code can only contain alphanumeric characters and dashes.",
        "any.required": "Code is required.",
      }),
    name: Joi.string().required(),
    co_names: Joi.string().required(),
  });

  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const createSubscriber = (data) => {
  const schema = Joi.object({
    subscriber_id: Joi.number().required(),
  });
  return schema.validate(data);
};

const deleteSubscriber = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    deleted_by: Joi.string().required().trim(),
    for_user_id: Joi.number().required(),
  });

  return schema.validate(data);
};

const viewSubscriber = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const updateSubscriber = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    for_user_id: Joi.number().required(),
    updated_by: Joi.string().required(),
  });

  return schema.validate(data);
};

export default {
  create,
  paginate,
  createSubscriber,
  deleteSubscriber,
  viewSubscriber,
  updateSubscriber,
};
