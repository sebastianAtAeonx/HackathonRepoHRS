import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    company_id: Joi.string().uppercase().trim().allow(""),
    department_name: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1").default("1"),
    // dept_type: Joi.string().valid("dx","ix").default("dx"),
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
    companyId: Joi.number().integer().min(1).optional(),
  });

  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    company_id: Joi.string().alphanum().uppercase().required().trim().allow(""),
    name: Joi.string().required().trim(),
    email: Joi.string().email({ tlds: { allow: false } }),
    id: Joi.string().required().trim(),
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
    id: Joi.string().uuid().required(),
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
