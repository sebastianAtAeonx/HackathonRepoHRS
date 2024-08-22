import Joi from "joi";

const view = (data) => {
  const schema = Joi.object({
    countryKey: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

export default {
  view,
};
