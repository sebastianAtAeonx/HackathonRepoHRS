import Joi from "joi";

const sendOtp = (data) => {
  const schema = Joi.object({
    // msmeNo: Joi.string().trim(),
    // mobileNo: Joi.string().trim(),
    msmeNo: Joi.string()
      .trim()
      .pattern(/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/) // Validates the Udyam format: UDYAM-XY-07-1234567
      .required()
      .messages({
        "string.empty": "MSME number cannot be empty",
        "string.pattern.base": "Invalid MSME number format.",
      }),
    mobileNo: Joi.string().length(10).pattern(/^\d+$/).required().messages({
        "string.empty": "Phone number is required.",
        "string.length": "Phone number must be exactly 10 digits.",
        "string.pattern.base": "Phone number must contain only digits.",
      }),
  });
  return schema.validate(data);
};

const submitOtp = (data) => {
  const schema = Joi.object({
    clientId: Joi.string().trim(),
    otp: Joi.string().trim(),
    // pan: Joi.string().alphanum().trim(),
    pan: Joi.string()
      .length(10)
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
      .messages({
        "string.length": "Pan Number should be 10 characters long",
        "string.pattern.base": "Invalid Pan No format",
      }),
  });
  return schema.validate(data);
};

const getMsmeDetails = (data) => {
  const schema = Joi.object({
    msmeNo: Joi.string()
      .trim()
      .pattern(/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/) // Validates the Udyam format: UDYAM-XY-07-1234567
      .required()
      .messages({
        "string.empty": "MSME number cannot be empty",
        "string.pattern.base": "Invalid MSME number format.",
      }),
    companyName: Joi.string().trim(),
  });
  return schema.validate(data);
};

export default {
  sendOtp,
  submitOtp,
  getMsmeDetails,
};
