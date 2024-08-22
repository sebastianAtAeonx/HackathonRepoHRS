import Joi from "joi";

const scheduleDemo = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().trim(),
    lastName: Joi.string().required().trim(),
    // email: Joi.string().required().trim(),
    // phoneNo: Joi.string().required().trim(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    phoneNo: Joi.string().length(10).pattern(/^\d+$/).required().messages({
      "string.empty": "Phone number is required.",
      "string.length": "Phone number must be exactly 10 digits.",
      "string.pattern.base": "Phone number must contain only digits.",
    }),
    coName: Joi.string().required().trim(),
    hearFrom: Joi.string().allow("").trim(),
  });
  return schema.validate(data);
};

export default {
  scheduleDemo,
};
