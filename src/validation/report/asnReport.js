import Joi from "joi";

const asnReport = (data) => {
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
    offset: Joi.number().allow("", null).default(0),
    limit: Joi.number().allow("", null).default(10000),
    sort: Joi.string().allow("", null).default("id"),
    order: Joi.string().valid("asc", "desc").allow("", null).default("desc"),
    status: Joi.string()
      .valid(
        "all",
        "materialShipped",
        "materialGateInward",
        "materialReceived",
        "qualityApproved",
        "invoiced",
        "partiallyPaid",
        "fullyPaid",
        "unpaid",
        "requested",
        "accepted"
      )
      .allow("", null)
      .default("all"),
    type: Joi.string().valid("ASN", "SCR", "").allow("", null).default(""),
    search: Joi.string().allow("", null).default(""),
    // filter: Joi.object({
    //   startDate: Joi.date().allow("", null).default(null),
    //   endDate: Joi.date().allow("", null).default(null),
    //   dateField: Joi.string()
    //     .valid("createdAt", "dispatchDate")
    //     .allow("", null)
    //     .default("createdAt"),
    // }).default({}),
    dropdown: Joi.string()
      .valid("supplier", "all")
      .allow("", null)
      .default("all"),
    invoiceType: Joi.string().valid("parkInvoiced", "postInvoiced"),
  });

  return schema.validate(data);
};

export default {
  asnReport,
};
