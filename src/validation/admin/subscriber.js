import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    phone: Joi.string().length(10).pattern(/^\d+$/).required().messages({
      "string.empty": "Phone number is required.",
      "string.length": "Phone number must be exactly 10 digits.",
      "string.pattern.base": "Phone number must contain only digits.",
    }),
    address: Joi.string().required(),
    plan_id: Joi.string().required(),
    status: Joi.string().allow("0", "1").default("1"),
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
    name: Joi.string().required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    phone: Joi.string().length(10).pattern(/^\d+$/).required().messages({
      "string.empty": "Phone number is required.",
      "string.length": "Phone number must be exactly 10 digits.",
      "string.pattern.base": "Phone number must contain only digits.",
    }),
    address: Joi.string().required(),
    plan_id: Joi.string().required(),
    status: Joi.string().allow("0", "1").default("1"),
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
    company_id: Joi.number(),
    name: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Department name is required" }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .allow(""),
    // portal_code_name: Joi.string().required(),
    // status: Joi.string().valid("0", "1").default("1"),
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
