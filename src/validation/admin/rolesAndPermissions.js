import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    role_id: Joi.number().integer().positive().required(),
    module_permissions: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().required(),
          permissions: Joi.array()
            .items(Joi.number().valid(0, 1))
            .length(4)
            .max(4)
            .min(4)
            .required(),
        }).required()
      )
      .required(),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    role_id: Joi.number().integer().positive().required(),
    module_permissions: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().required(),
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

const del = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().trim(),
  });

  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    role_id: Joi.number().integer().positive().required(),
  });

  return schema.validate(data);
};

export default {
  create,
  update,
  del,
  view,
};
