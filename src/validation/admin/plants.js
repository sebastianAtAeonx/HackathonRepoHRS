import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    code: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Za-z0-9-]+$/)
      .messages({
        "string.base": "Code must be a string.",
        "string.pattern.base":
          "Code can only contain alphanumeric characters and dashes.",
        "any.required": "Code is required.",
      }),
    name: Joi.string().required().trim(),
    street: Joi.string().required().trim(),
    city: Joi.string().required().trim(),
    postal_code: Joi.string().required().trim(),
    po_box: Joi.string().required().trim(),
    country_id: Joi.number().required().integer(),
    state_code: Joi.number().required().integer(),
    company_code: Joi.number().required().integer(),
    status: Joi.string().valid("0", "1", "").default("1"),
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
    country_id: Joi.number().allow("", null).default(null),
    state_code: Joi.number().allow("", null).default(null),
    company_code: Joi.number().allow("", null).default(null),
  });

  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().trim(),
    code: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Za-z0-9-]+$/)
      .messages({
        "string.base": "Code must be a string.",
        "string.pattern.base":
          "Code can only contain alphanumeric characters and dashes.",
        "any.required": "Code is required.",
      }),
    name: Joi.string().required().trim(),
    street: Joi.string().required().trim(),
    city: Joi.string().required().trim(),
    postal_code: Joi.string().required().trim(),
    po_box: Joi.string().required().trim(),
    country_id: Joi.number().required().integer(),
    state_code: Joi.number().required().integer(),
    company_code: Joi.number().required().integer(),
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
    id: Joi.string().required(),
  });

  return schema.validate(data);
};

const importExcel = (data) => {
  const schema = Joi.object({
    code: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Za-z0-9-]+$/)
      .messages({
        "string.base": "Code must be a string.",
        "string.pattern.base":
          "Code can only contain alphanumeric characters and dashes.",
        "any.required": "Code is required.",
      }),
    name: Joi.string().required().trim(),
    street: Joi.string().required().trim(),
    city: Joi.string().required().trim(),
    postal_code: Joi.string().required().trim(),
    po_box: Joi.string().required().trim(),
    country_key: Joi.number().required().integer(),
    state_code: Joi.number().required().integer(),
    company_code: Joi.number().required().integer(),
    rowNumber: Joi.number(),
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
