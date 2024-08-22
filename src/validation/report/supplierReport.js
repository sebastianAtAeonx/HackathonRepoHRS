import Joi from "joi";

const supplierReport = (data) => {
  const schema = Joi.object({
    startDate: Joi.date(),
    endDate: Joi.date()
      .min(Joi.ref("startDate"))
      .optional()
      .allow(null, "")
      .messages({
        "date.base": "End date must be a valid date.",
        "date.min": "End date cannot be before start date.",
      }),
    month: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .optional()
      .allow(null, "")
      .messages({
        "number.base": "Month must be a number.",
        "number.min": "Month must be at least 1.",
        "number.max": "Month must be at most 12.",
      }),
    year: Joi.number(),
    status: Joi.string()
      .valid("pending", "approved", "queried", "rejected", "verified", "all")
      .default("all"),
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("created_at"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("").default(""),
  });

  return schema.validate(data);
};

export default {
  supplierReport,
};
