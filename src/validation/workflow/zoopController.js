import Joi from "joi";

const verifyGst = (data) => {
  const schema = Joi.object({
    gst_no: Joi.string()
      .alphanum()
      .min(15)
      .max(15)
      .trim()
      .pattern(
        new RegExp(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
        "Incorrect GST number"
      )
      .required(),
    refresh: Joi.bool(),
  });
  return schema.validate(data);
};

const verifyBankAccount = (data) => {
  const schema = Joi.object({
    account_number: Joi.string().required(),
    ifsc_code: Joi.string().required(),
  });

  return schema.validate(data);
};

export default {
  verifyGst,
  verifyBankAccount,
};
