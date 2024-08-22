import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    role_name: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1").default("1"),
    module_permissions: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().required(),
          module_key: Joi.string(),
          permission: Joi.array()
            .items(Joi.number().valid(0, 1))
            .length(4)
            .max(4)
            .min(4)
            .required(),
          name: Joi.string(),
        }).required()
      )
      .required(),
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
    key: Joi.string().default(0).valid(0, 1),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    role_name: Joi.string().required().trim(),
    id: Joi.number().required(),
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

export default {
  create,
  paginate,
  update,
  del,
  view,
};
