import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    moduleName: Joi.string().required(),
    status: Joi.string().valid("1", "0", "").default("1"),
    fields: Joi.array()
      .items(
        Joi.object({
          key: Joi.string().required(),
          fieldtype: Joi.string().required(),
          displayName: Joi.string().required(),
          required: Joi.string().valid("1", "0").required(),
          display: Joi.string().valid("1", "0").required(),
          is_primary: Joi.string().valid("1", "0").required(),
          status: Joi.string().valid("1", "0", "").default("1"),
        })
      )
      .required(),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    moduleName: Joi.string().required(),
    status: Joi.string().valid("1", "0", "").default("1"),
    fields: Joi.array()
      .items(
        Joi.object({
          key: Joi.string().required(),
          fieldtype: Joi.string().required(),
          displayName: Joi.string().required(),
          required: Joi.string().valid("1", "0").required(),
          display: Joi.string().valid("1", "0").required(),
          is_primary: Joi.string().valid("1", "0").required(),
          status: Joi.string().valid("1", "0", "").default("1"),
        })
      )
      .required(),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    moduleName: Joi.string().required(),
    key: Joi.string().required(),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    moduleName: Joi.string().required(),
    key: Joi.string(),
  });

  return schema.validate(data);
};

export default {
  create,
  update,
  del,
  view,
};
