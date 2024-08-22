import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    role_name: Joi.string().required(),
    permissions: Joi.required(),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    role_name: Joi.string().required(),
    permissions: Joi.required(),
    id: Joi.required(),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.required(),
  });

  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.required(),
  });
  return schema.validate(data);
};

const getModule = (data) => {
  const schema = Joi.object({
    role_id: Joi.required(),
  });
  return schema.validate(data);
};

export default {
  create,
  update,
  del,
  view,
  getModule,
};
