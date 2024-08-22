import Joi from "joi";

const paginateCompany = (data) => {
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

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      //   endDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date()
        .min(Joi.ref("startDate"))
        .optional()
        .allow(null, "")
        .messages({
          "date.base": "End date must be a valid date.",
          "date.min": "End date cannot be before start date.",
        }).default(null),
      dateField: Joi.string()
        .valid("createdAt", "updatedAt")
        .allow("", null)
        .default("created_at"),
    }).default({}),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

export default {
  paginateCompany,
  paginate,
  view,
};
