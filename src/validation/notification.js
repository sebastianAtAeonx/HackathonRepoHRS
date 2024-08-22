import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    user_id: Joi.array().required(),
    message: Joi.string().required(),
    heading: Joi.string().required(),
    read: Joi.string().required().valid("0", "1"),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("read"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1").default(null),
    search: Joi.string().allow("", null).default(null),
    filter: Joi.object().default({}),
  });
  return schema.validate(data);
};

const readAll = (data) => {
  const schema = Joi.object({
    ids: Joi.array().items(Joi.number()).required(),
  });
  return schema.validate(data);
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
  readAll,
  view,
};
