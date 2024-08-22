import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    pr_id: Joi.number().required(),
    item_id: Joi.number().required(),
    qty: Joi.string().required().trim(),
    status: Joi.string()
      .valid("pending", "processing", "cancelled", "hold")
      .default("pending"),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string()
      .valid("pending", "processing", "cancelled", "hold")
      .default("pending"),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    pr_id: Joi.number().required(),
    item_id: Joi.number().required(),
    qty: Joi.string().required().trim(),
    status: Joi.string()
      .valid("pending", "processing", "cancelled", "hold")
      .default("pending"),
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

export default {
  create,
  paginate,
  update,
  del,
  view,
};
