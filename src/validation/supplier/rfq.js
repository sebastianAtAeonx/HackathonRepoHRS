import Joi from "joi";

const createRfq = (data) => {
  const joiSchema = Joi.object({
    rfq_type: Joi.string().required().valid("AN", "ZRQ1"),
    pr_id: Joi.number().required(),
    language_id: Joi.string().required(),
    rfq_date: Joi.date().required(),
    deadline: Joi.date().required(),
    purchase_group_id: Joi.number().required(),
    purchase_org_id: Joi.number().required(),
    item_category_id: Joi.number().required(),
    delivery_date: Joi.date().required(),
    plant_id: Joi.string().required(),
    storage_loc_id: Joi.number().required(),
    attachment: Joi.string().allow("", {}),
    vendor: Joi.array().items(Joi.string()).optional(),
  }).unknown(false);

  return joiSchema.validate(data);
};

const paginateRfq = (data) => {
  const schema = Joi.object({
    id: Joi.number().allow(""),
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("created_at"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
  }).unknown(true);
  return schema.validate(data);
};

const updateRfq = (data) => {
  const JoiSchema = Joi.object({
    id: Joi.number().required(),
    rfq_type: Joi.string().required().valid("AN", "ZRQ1"),
    pr_id: Joi.number().required(),
    language_id: Joi.string().required(),
    rfq_date: Joi.date().required(),
    deadline: Joi.date().required(),
    purchase_group_id: Joi.number().required(),
    purchase_org_id: Joi.number().required(),
    item_category_id: Joi.number().required(),
    delivery_date: Joi.date().required(), // new to add
    plant_id: Joi.string().required(),
    storage_loc_id: Joi.number().required(),
    attachment: Joi.string().allow("", {}),
    vendor: Joi.array().items(Joi.string()).optional(),

  }).unknown(true);

  return JoiSchema.validate(data);
};

const deleteRfq = (data) => {
  const JoiSchema = Joi.object({
    id: Joi.number().required(),
  }).unknown(true);

  return JoiSchema.validate(data);
};

export default {
  createRfq,
  paginateRfq,
  updateRfq,
  deleteRfq,
};
