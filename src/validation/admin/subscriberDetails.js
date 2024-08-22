import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    subscriber_id: Joi.number().required(),
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

const update = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    for_user_id: Joi.number().required(),
    updated_by: Joi.string().required().trim(),
    logo: Joi.string().optional(),
    halflogo: Joi.string().optional(),
    favicon: Joi.string().optional(),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    deleted_by: Joi.string().required().trim(),
    for_user_id: Joi.number().required(),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });

  return schema.validate(data);
};

const updateProfilePass = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    subscriber_id: Joi.number().required(),
    old_password: Joi.string().required().trim(),
    new_password: Joi.string().required().trim(),
    confirm_password: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  updateProfilePass,
};
