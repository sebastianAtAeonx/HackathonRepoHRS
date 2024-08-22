import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    department_id: Joi.string().required(),
    portal_code: Joi.string().allow(""),
    level_1_user_id: Joi.array().items(Joi.number()).required(),
    level_2_user_id: Joi.array()
      .items(Joi.number())
      .allow("", null)
      .default([]),
    status: Joi.string().valid("0", "1").default("1"),
    approval_hierarchy_id: Joi.number().required(),
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
    id: Joi.string().required(),
    portal_code: Joi.string().required(),
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
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const getApproverName = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  getApproverName,
};
