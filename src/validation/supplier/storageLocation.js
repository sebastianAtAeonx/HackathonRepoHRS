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
    plantId: Joi.string().required().trim(),
    description: Joi.string().required().trim(),
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
    plantId: Joi.string().trim(),
  });

  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
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
    description: Joi.string().required().trim(),
    plantId: Joi.string(),
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
  schema.validate(data);
};
const storageLocation = (data) => {
  const schema = Joi.object({
    plantId: Joi.string().required(),
    storageLocationCode: Joi.string().max(4).required(),
    storageLocationName: Joi.string(),
    storageLocationDesc: Joi.string(),
  });
  schema.validate(data);
};

const importExcel = (data) => {
  const schema = Joi.object({
    code: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Code is Required" }),
    name: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Name is Required" }),
    plantId: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Plant is Required" }),
    description: Joi.string()
      .required()
      .trim()
      .messages({ "string.empty": "Description is Required" }),
    rowNumber: Joi.number(),
  });

  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  storageLocation,
  importExcel,
};
