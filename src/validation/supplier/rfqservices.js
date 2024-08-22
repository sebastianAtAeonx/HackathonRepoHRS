import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    rfq_id: Joi.number().required(),
    service_id: Joi.number().required(),
    status: Joi.valid("draft", "submitted", "approved", "rejected").default(
      "draft"
    ),
  });

  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string()
      .valid("draft", "submitted", "approved", "rejected", "")
      .default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    rfq_id: Joi.number().required(),
    service_id: Joi.number().required(),
    status: Joi.valid("draft", "submitted", "approved", "rejected").default(
      "draft"
    ),
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
const status = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    status: Joi.string()
      .valid("draft", "submitted", "approved", "rejected")
      .required(),
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
  status,
};
