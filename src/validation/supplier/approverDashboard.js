import Joi from "joi";

const supplierDetails = (data) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid("pending", "approved", "verified", "rejected", "queried", "")
      .default("pending"),
    offset: Joi.number().integer().default(0),
    limit: Joi.number().integer().default(50),
    order: Joi.string().valid("asc", "desc").default("desc"),
    sort: Joi.string().default("created_at"),
  });

  return schema.validate(data);
};

const percentage = (data) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid("pending", "approved", "verified", "rejected", "queried", "")
      .default("pending"),
  });
  return schema.validate(data);
};

export default {
  supplierDetails,
  percentage,
};
