import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    dept_id: Joi.string().required(),
    status: Joi.string().allow("0", "1", "").default("1"),
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
    name: Joi.string().required(),
    dept_id: Joi.string().required(),
    status: Joi.string().allow("0", "1", "").default("1"),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const filter = (data) => {
  const schema = Joi.object({
    dept_id: Joi.string(),
  });
  return schema.validate(data);
};

const create2 = (data) => {
  const schema = Joi.object({
    dept_id: Joi.string().required(),
    porstal_department_code: Joi.string().required(),
    portal_code: Joi.string().required(),
  });

  return schema.validate(data);
};

export default { 
  create,
  paginate,
  update,
  del,
  view,
  filter,
  create2,
};
