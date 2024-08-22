import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    code: Joi.string().required().trim().messages({
      "string.empty": "Code cannot be empty",
      "any.required": "Code is required",
    }),
    name: Joi.string().required().trim().messages({
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
    }),
    description: Joi.string().required().trim().messages({
      "string.empty": "Description cannot be empty",
      "any.required": "Description is required",
    }),
    material_grp_id: Joi.number().required().messages({
      "any.required": "Material Group is required",
    }),
    unit_id: Joi.number().required().messages({
      "any.required": "Unit is required",
    }),
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
    code: Joi.string().required().trim().messages({
      "string.empty": "Code cannot be empty",
      "any.required": "Code is required",
    }),
    name: Joi.string().required().trim().messages({
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
    }),
    description: Joi.string().required().trim().messages({
      "string.empty": "Description cannot be empty",
      "any.required": "Description is required",
    }),
    material_grp_id: Joi.number().required().messages({
      "any.required": "Material Group is required",
    }),
    unit_id: Joi.number().required().messages({
      "any.required": "Unit is required",
    }),
    status: Joi.string().valid("0", "1").default("1"),
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

const deleteAll = (data) => {
  const schema = Joi.object({
    ids: Joi.array().items(Joi.number()).required(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  deleteAll,
};
