import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    username: Joi.string().allow("").trim(),
    password: Joi.string().allow("").trim(),
    clientId: Joi.string().allow("").trim(),
    clientSecret: Joi.string().allow("").trim(),
    grantType: Joi.string().allow("").trim(),
    apiKey: Joi.string().allow("").trim(),
    secretKey: Joi.string().allow("").trim(),
    url: Joi.string().uri().allow("").trim(),
    authorization: Joi.string().allow("").trim(),
    apiVersion: Joi.string().allow("").trim(),
    status: Joi.string().allow("0", "1", "").default("1"),
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
    name: Joi.string().required().trim(),
    username: Joi.string().allow("").trim(),
    password: Joi.string().allow("").trim(),
    clientId: Joi.string().allow("").trim(),
    clientSecret: Joi.string().allow("").trim(),
    grantType: Joi.string().allow("").trim(),
    apiKey: Joi.string().allow("").trim(),
    secretKey: Joi.string().allow("").trim(),
    url: Joi.string().uri().allow("").trim(),
    authorization: Joi.string().allow("").trim(),
    apiVersion: Joi.string().allow("").trim(),
    status: Joi.string().allow("0", "1", "").default("1"),
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
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const countApiCalls = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("controller"), // Assuming default sorting by controller
    order: Joi.string().valid("asc", "desc").default("asc"), // Assuming default order as ascending
    filter: Joi.object({
      startdate: Joi.string().allow("", null).default(null),
      enddate: Joi.string().allow("", null).default(null),
    }).default({}),
    search: Joi.string().allow("", null).default(null), // Adding search field for filtering
  });

  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  countApiCalls,
};
