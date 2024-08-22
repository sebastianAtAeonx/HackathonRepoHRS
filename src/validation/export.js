import Joi from "joi";

const fetchData = (data) => {
  const schema = Joi.object({
    table_name: Joi.string().required(),
    fields: Joi.object().required(),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    filter: Joi.object().keys({
      startDate: Joi.date().iso().raw().allow(""),
      endDate: Joi.date().iso().raw().allow(""),
      dateField: Joi.string()
        // .valid("created_at", "createdAt", "updated_at", "updatedAt")
        .allow(""),
    }),
    type: Joi.string().allow("", null),
    status: Joi.string().allow(""),
    selected_ids: Joi.alternatives(
      Joi.string().allow("").default(""),
      Joi.array().items(Joi.alternatives(Joi.string(), Joi.number()))
    ).default([]),
  }).unknown(true);

  return schema.validate(data);
};

export default {
  fetchData,
};
