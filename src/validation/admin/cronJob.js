import Joi from "joi";

const create = () => {
  return Joi.object({
    time_unit: Joi.string()
      .valid("daily", "hourly", "weekly", "monthly", "yearly")
      .required()
      .trim(),
    day: Joi.string()
      .trim()
      .allow("")
      .when("time_unit", {
        is: Joi.valid("weekly"),
        then: Joi.required(),
      }),
    time: Joi.string().trim().allow(""),
    date: Joi.date().allow(null),
    url: Joi.string()
      .required()
      .uri()
      .regex(/^https?:\/\//),
  });

  // return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date().allow("", null).default(null),
      dateField: Joi.string()
        .valid("created_at", "updated_at")
        .allow("", null)
        .default("created_at"),
    }).default({}),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
};
