import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    subscriber_id: Joi.number().integer().required(),
    role_id: Joi.number().integer().required(),
    approval_hierarchy_level: Joi.number().integer().positive().required(),
    approval_level_name: Joi.array()
      .items(
        Joi.object({
          level: Joi.number().integer().positive().required(),
          name: Joi.string().required(),
          status: Joi.number().integer().required(),
        })
      )
      .min(1)
      .max(Joi.ref("approval_hierarchy_level"))
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
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    subscriber_id: Joi.number().integer().required(),
    approval_hierarchy_level: Joi.number().integer().positive().required(),
    approval_level_name: Joi.array()
      .items(
        Joi.object({
          level: Joi.number().integer().positive().required(),
          name: Joi.string().required(),
          status: Joi.number().integer().required(),
        })
      )
      .min(1)
      .max(Joi.ref("approval_hierarchy_level"))
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
    subscriber_id: Joi.number().integer().required(),
    role_id: Joi.number().integer().required(),
    approval_hierarchy_id: Joi.number().integer().positive().required(),
    approval_level: Joi.required(),
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
