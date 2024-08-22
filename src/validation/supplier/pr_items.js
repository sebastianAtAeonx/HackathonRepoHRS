import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    item_name: Joi.string().allow(null, ""),
    item_description: Joi.string().allow(null, ""),
    item_category: Joi.string().allow(null, ""),
    item_unit: Joi.string().allow(null, ""),
    item_quantity: Joi.string().allow(null, ""),
    expected_item_price: Joi.string().allow(null, ""),
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
    id: Joi.string().uuid().required(),
    item_name: Joi.string().allow(null, ""),
    item_description: Joi.string().allow(null, ""),
    item_category: Joi.string().allow(null, ""),
    item_unit: Joi.string().allow(null, ""),
    item_quantity: Joi.string().allow(null, ""),
    expected_item_price: Joi.string().allow(null, ""),
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
    id: Joi.string().uuid().required(),
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
