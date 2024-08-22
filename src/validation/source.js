import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    name: Joi.string().alphanum().required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    password: Joi.string().required(),
    status: Joi.string().valid("0", "1").required(),
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
    name: Joi.string().alphanum().required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    status: Joi.string().valid("0", "1").required(),
  });
  return schema.validate(data);
};

const del = (data) => {
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
};
