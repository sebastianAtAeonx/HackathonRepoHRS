import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    name: Joi.string().alphanum().required().trim(),
    code: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Za-z0-9-]+$/)
      .messages({
        "string.base": "Code must be a string.",
        "string.pattern.base":
          "Code can only contain alphanumeric characters and dash.",
        "any.required": "Code is required.",
      }),
    symbol: Joi.string().required().trim(),
    position: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1", "").default("1"),
    country_key: Joi.string().required().trim(),
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
    code: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Za-z0-9-]+$/)
      .messages({
        "string.base": "Code must be a string.",
        "string.pattern.base":
          "Code can only contain alphanumeric characters and dash.",
        "any.required": "Code is required.",
      }),
    symbol: Joi.string().required().trim(),
    position: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1").default("1"),
    country_key: Joi.string().required().trim(),
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

const importExcel = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Name is required" }),
    code: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Za-z0-9-]+$/)
      .messages({
        "string.base": "Code must be a string.",
        "string.pattern.base":
          "Code can only contain alphanumeric characters and dash.",
        "any.required": "Code is required.",
      }),
    symbol: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Symbol is required" }),
    position: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Position is Required" }),
    // country_key: Joi.string().required().trim(),
  }).unknown(true);
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  importExcel,
};
