import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    key: Joi.string().required().trim(),
    module_name: Joi.string().required().trim(),
    group_name: Joi.string().required().trim(),
    required: Joi.string().valid("0", "1").default("1").required(),
    display: Joi.string().valid("0", "1").default("1").required(),
    display_name: Joi.string().required().trim(),
    panel_id: Joi.string().required().trim(),
    department: Joi.string().required().trim(),
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
    required: Joi.string().valid("0", "1").default("1"),
    display: Joi.string().valid("0", "1").default("1"),
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

const updateFieldInternational = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    required: Joi.string().valid("0", "1").default("1"),
    display: Joi.string().valid("0", "1").default("1"),
  });
  return schema.validate(data);
};

const additionalFieldCreate = (data) => {
  const schema = Joi.object({
    keyname: Joi.string().required(),
    type: Joi.string().required(),
    module_name: Joi.string().required(),
    is_primary: Joi.valid("0", "1").default("0"),
    display: Joi.valid("0", "1").default("0"),
    display_name: Joi.string().required(),
    panel_id: Joi.number().required(),
    group_name: Joi.string().required(),
    required: Joi.valid("0", "1").default("0"),
  });
  return schema.validate(data);
};

const additionalFieldDelete = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const deleteAdditionalFieldValueDy = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    created_at: Joi.string().required(),
  });
  return schema.validate(data);
};

const viewAdditionalFieldValueDy = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    created_at: Joi.string().required(),
  });
  return schema.validate(data);
};

const getGroupNames = (data) => {
  const schema = Joi.object({
    module_name: Joi.string().required(),
  });
  // .options({ allowUnknown: true })
  // .required();

  return schema.validate(data);
};

const getFieldNames = (data) => {
  const schema = Joi.object({
    module_name: Joi.string().required(),
    group_name: Joi.string().required(),
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
  });
  return schema.validate(data);
};

const getfieldnamesInternational = (data) => {
  const schema = Joi.object({
    module_name: Joi.string().required(),
    group_name: Joi.string().required(),
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
  });
  return schema.validate(data);
};

const displayAdditionalField = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const listAdditionalField = (data) => {
  const schema = Joi.object({
    subscriber_id: Joi.string().required(),
  });
  return schema.validate(data);
};

const deleteAdditionalField = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};
const updateAdditionalField = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    subscriber_id: Joi.string().required(),
    module_name: Joi.string().required(),
    group_name: Joi.string().required(),
    panel_id: Joi.string().required(),
    key: Joi.string().required(),
    field_type: Joi.string().required(),
    is_primary: Joi.string().required(),
    display: Joi.string().required(),
    required: Joi.string().required(),
    display_name: Joi.string().required(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  updateFieldInternational,
  additionalFieldCreate,
  additionalFieldDelete,
  deleteAdditionalFieldValueDy,
  viewAdditionalFieldValueDy,
  getGroupNames,
  getFieldNames,
  getfieldnamesInternational,
  displayAdditionalField,
  listAdditionalField,
  deleteAdditionalField,
  updateAdditionalField,
};
