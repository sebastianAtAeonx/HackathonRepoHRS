import Joi from "joi";

const fetchPoDetails = (data) => {
  const schema = Joi.object({
    PoNumber: Joi.string().required(),
  });
  return schema.validate(data);
};

const fetchPoList = (data) => {
  const schema = Joi.object({
    SUPPLIER: Joi.string().required(),
    type: Joi.string().valid("service", "material", "").default(""),
    search: Joi.string().allow("").default(""),
    offset: Joi.number().integer().default(0),
    limit: Joi.number().integer().default(100),
    order: Joi.string().valid("asc", "desc").default("desc"),
    sort: Joi.string().default("PO_NUMBER"),
  });
  return schema.validate(data);
};

export default {
  fetchPoDetails,
  fetchPoList,
};
