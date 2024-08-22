import Joi from "joi";

const getSetting = (data) => {
  const schema = Joi.object({
    supplier_id: Joi.number().required(),
  });
  return schema.validate(data);
};

const setSetting = (data) => {
  const schema = Joi.object({
    supplier_id: Joi.number().required(),
    gstHide: Joi.string().valid("0", "1").default("0"),
    asnHide: Joi.string().valid("0", "1").default("0"),
    supplierHide: Joi.string().valid("0", "1").default("0"),
    emailHide: Joi.string().valid("0", "1").default("0"),
    addressHide: Joi.string().valid("0", "1").default("0"),
    panHide: Joi.string().valid("0", "1").default("0"),
    orderLineHide: Joi.string().valid("0", "1").default("0"),
    billaddressHide: Joi.string().valid("0", "1").default("0"),
    supplieraddressHide: Joi.string().valid("0", "1").default("0"),
    inrHide: Joi.string().valid("0", "1").default("0"),
    ewayHide: Joi.string().valid("0", "1").default("0"),
    invoiceHide: Joi.string().valid("0", "1").default("0"),
  });
  return schema.validate(data);
};

export default {
  getSetting,
  setSetting,
};
