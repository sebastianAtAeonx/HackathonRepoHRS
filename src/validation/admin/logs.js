import Joi from "joi";

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date().allow("", null).default(null),
      dateField: Joi.string()
        .valid("timestamp")
        .allow("", null)
        .default("timestamp"),
    }).default({}),
  });
  return schema.validate(data);
};

export default {
  paginate,
};
