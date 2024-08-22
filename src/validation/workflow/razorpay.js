import Joi from "joi";

const ifsctobankdetails = (data) => {
  const schema = Joi.object({
    ifsc: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

export default {
  ifsctobankdetails,
};
