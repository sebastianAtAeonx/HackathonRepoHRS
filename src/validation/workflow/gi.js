import Joi from "joi";

const giToSap = (data) => {
  const schema = Joi.object({
    fromDate: Joi.string().allow(""),
    toDate: Joi.date()
      .min(Joi.ref("fromDate"))
      .optional()
      .allow(null, "")
      .messages({
        "date.base": "End date must be a valid date.",
        "date.min": "End date cannot be before start date.",
      }),
    Days: Joi.number().allow("").default(60),
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
    grnCodeExists: Joi.boolean(),
    asnIdExists: Joi.boolean(),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date()
        .min(Joi.ref("startDate"))
        .optional()
        .allow(null, "")
        .default(null)
        .messages({
          "date.base": "End date must be a valid date.",
          "date.min": "End date cannot be before start date.",
        }),
      dateField: Joi.string()
        .valid("createdAt", "updatedAt")
        .allow("", null)
        .default("createdAt"),
    }).default({}),
  });
  return schema.validate(data);
};

export default {
  giToSap,
  paginate,
};
