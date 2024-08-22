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
    hsnCode: Joi.string().allow(""),
    price: Joi.number().required().min(0).messages({
      "number.base": "Price must be a number.",
      "number.min": "Price must be greater than or equal to 0.",
      "any.required": "Price is required.",
    }),
    tax: Joi.number().required().min(0).max(100).messages({
      "number.base": "Tax must be a number.",
      "number.min": "Tax must be greater than or equal to 0.",
      "number.max": "Tax must be less than or equal to 100.",
      "any.required": "Tax is required.",
    }),
    plants: Joi.array()
      .items(
        Joi.object({
          plant: Joi.string().allow("").optional(),
        })
      )
      .optional(),
    description: Joi.string().required(),
    unit_id: Joi.number().required(),
    material_group_id: Joi.number().required(),
    storage_locations: Joi.array()
      .items(
        Joi.object({
          storage_location: Joi.string().allow("").optional(),
        })
      )
      .optional(),
    material_type_id: Joi.number().required(),
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
    dropDown: Joi.string().valid("0", "1", "").allow("", null).default(null),
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
    name: Joi.string().required(),
    hsnCode: Joi.string().allow(""),
    price: Joi.number().required().min(0).messages({
      "number.base": "Price must be a number.",
      "number.min": "Price must be greater than or equal to 0.",
      "any.required": "Price is required.",
    }),
    tax: Joi.number().required().min(0).max(100).messages({
      "number.base": "Tax must be a number.",
      "number.min": "Tax must be greater than or equal to 0.",
      "number.max": "Tax must be less than or equal to 100.",
      "any.required": "Tax is required.",
    }),
    plants: Joi.array()
      .items(
        Joi.object({
          plant: Joi.string().allow("").optional(),
        })
      )
      .optional(),
    description: Joi.string().required(),
    unit_id: Joi.number().required(),
    material_group_id: Joi.number().required(),
    storage_locations: Joi.array()
      .items(
        Joi.object({
          storage_location: Joi.string().allow("").optional(),
        })
      )
      .optional(),
    material_type_id: Joi.number().required(),
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
    name: Joi.string().required(),
    hsnCode: Joi.string().allow("", null),
    price: Joi.number().required().min(0).messages({
      "number.base": "Price must be a number.",
      "number.min": "Price must be greater than or equal to 0.",
      "any.required": "Price is required.",
    }),
    tax: Joi.number().required().min(0).max(100).messages({
      "number.base": "Tax must be a number.",
      "number.min": "Tax must be greater than or equal to 0.",
      "number.max": "Tax must be less than or equal to 100.",
      "any.required": "Tax is required.",
    }),
    plants: Joi.string()
      .required()
      .messages({ "string.empty": "Plant is required" }),
    description: Joi.string().required(),
    unit_id: Joi.number()
      .required()
      .messages({ "number.base": "Unit is required" }),
    material_group_id: Joi.number()
      .required()
      .messages({ "number.base": "matrial Group is required" }),
    storage_locations: Joi.string()
      .required()
      .messages({ "string.empty": "Storage Location is required" }),
    material_type_id: Joi.number()
      .required()
      .messages({ "number.base": "Material Type is required" }),
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
  importExcel,
};
