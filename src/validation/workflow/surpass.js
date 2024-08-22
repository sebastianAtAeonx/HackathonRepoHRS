import Joi from "joi";

const verifyBankAccount = (data) => {
  const schema = Joi.object({
    bankAcNo: Joi.string().required(),
    ifsc: Joi.string().required(),
  });

  return schema.validate(data);
};

export default {
  verifyBankAccount,
};
