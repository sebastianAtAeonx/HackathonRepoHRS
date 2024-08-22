import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    parent_id: Joi.number().allow(null),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("asc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
};
