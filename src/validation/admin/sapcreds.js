import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    client: Joi.string().allow("").trim(),
    username: Joi.string().allow("").trim(),
    password: Joi.string().allow("").trim(),
    url: Joi.string().uri().required().trim(),
    tokenPath: Joi.string().allow("").trim(),
    cookie: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1").default("1"),
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
    id: Joi.string().required(),
    name: Joi.string().required().trim(),
    client: Joi.string().allow("").trim(),
    username: Joi.string().allow("").trim(),
    password: Joi.string().allow("").trim(),
    url: Joi.string().uri().required().trim(),
    tokenPath: Joi.string().allow("").trim(),
    cookie: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1").default("1"),
  });

  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
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
