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
    name: Joi.string().required(),
    co_names: Joi.string().required(),
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
    id: Joi.number().required().messages({
      "any.required": "Id is required",
      "number.base": "Id must be a number",
    }),
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
    name: Joi.string().required(),
    co_names: Joi.string().required(),
    status: Joi.string().valid("0", "1").required(),
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
    name: Joi.string().required().messages({
      "string.empty": `Name cannot be an empty field`,
      "any.required": `Name is a required field`,
    }),
    co_names: Joi.string().required().messages({
      "string.empty": `Company Name  cannot be an empty field`,
      "any.required": `Company Name is a required field`,
    }),
    rowNumber: Joi.number(), // Add the row number to the schema for count row from excel
  });

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
