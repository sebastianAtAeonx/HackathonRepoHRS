import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    companyName: Joi.string().required().trim(),
    contactPerson: Joi.string().required().trim(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    phone: Joi.string().length(10).pattern(/^\d+$/).required().messages({
      "string.empty": "Phone number is required.",
      "string.length": "Phone number must be exactly 10 digits.",
      "string.pattern.base": "Phone number must contain only digits.",
    }),
    location: Joi.string().required().trim(),
    status: Joi.string().allow("1", "0").default("1"),
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
    id: Joi.string().required().trim(),
    companyName: Joi.string().required().trim(),
    contactPerson: Joi.string().required().trim(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    phone: Joi.string().length(10).pattern(/^\d+$/).required().messages({
      "string.empty": "Phone number is required.",
      "string.length": "Phone number must be exactly 10 digits.",
      "string.pattern.base": "Phone number must contain only digits.",
    }),
    location: Joi.string().required().trim(),
    status: Joi.string().allow("1", "0").default("1"),
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
