import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    auction_id: Joi.number().required(),
    supplier_id: Joi.string().required().trim(),
    bid_amount: Joi.string().required(),
    bid_date: Joi.string().required(),
    status: Joi.valid("0", "1").default("1"),
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
    auction_id: Joi.number().required(),
    supplier_id: Joi.string().required(),
    bid_amount: Joi.string().required(),
    bid_date: Joi.string().required(),
    status: Joi.valid("0", "1").default("1"),
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
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const supplierRank = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().valid("", "bid_amount").default("bid_amount"),
    order: Joi.string().valid("asc", "desc").default("asc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const Rank = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    status: Joi.string().valid("0", "1", "").default("1"),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  supplierRank,
  Rank,
};
