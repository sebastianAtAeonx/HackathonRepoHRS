import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    companies: Joi.array().items(Joi.number()).required(),
    reconciliationAc: Joi.number().required(),
    vendor_class: Joi.number().required(),
    vendor_schema: Joi.number().required(),
    business_partner_group: Joi.number().required(),
    supplier_id: Joi.string().required(),
    payment_terms: Joi.number().required(),
    purchase_group: Joi.number().required(),

    itWitholding: Joi.array().items(
      Joi.object({
        taxType: Joi.string().allow("", null),
        wtSubjct: Joi.string().allow("", null),
        taxCode: Joi.string().allow("", null),
        recipientType: Joi.string().allow("", null),
      })
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
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    supplier_id: Joi.string().required(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  view,
};
