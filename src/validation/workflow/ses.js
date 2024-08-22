import Joi from "joi";

const SEStoSAP = (data) => {
  const schema = Joi.object({
    fromDate: Joi.string().allow(""),
    toDate: Joi.string().allow(""),
    Days: Joi.number().allow("").default(30),
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
    sesCode: Joi.string().allow("", null).default(null),
    asnId: Joi.string().allow("", null).default(null),
    // filter: Joi.object().default({}),
    filter: Joi.object()
      .keys({
        startDate: Joi.date().iso().raw().allow(""),
        endDate: Joi.date().iso().raw().allow(""),
        dateField: Joi.string()
          .valid("createdAt", "updatedAt", "sesTime")
          .allow(""),
      })
      .default(null),
  });
  return schema.validate(data);
};

const getSESCode = (data) => {
  const schema = Joi.object({
    sesUniqueId: Joi.string().required(),
  });
  return schema.validate(data);
};

export default {
  SEStoSAP,
  paginate,
  getSESCode,
};
