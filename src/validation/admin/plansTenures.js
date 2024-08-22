import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    plan_id: Joi.string().required().trim(),
    tenure: Joi.string().required().trim(),
    months: Joi.number().required(),
    price: Joi.number().required(),
    discounted_price: Joi.number().required(),
    status: Joi.string().valid("0", "1").default("1"),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(10),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
    status: Joi.string().valid("0", "1", "").default(""),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().trim(),
    plan_id: Joi.string().required().trim(),
    tenure: Joi.string().required().trim(),
    months: Joi.number().required(),
    price: Joi.number().required(),
    discounted_price: Joi.number().required(),
    status: Joi.string().valid("0", "1").default("1"),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().trim(),
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
  update,
  del,
  view,
};
