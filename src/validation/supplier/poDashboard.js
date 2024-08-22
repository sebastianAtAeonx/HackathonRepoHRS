import Joi from "joi";

const count = (data) => {
  const schema = Joi.object({
    supplier: Joi.string().required(),
  });
  return schema.validate(data);
};

export default {
  count,
};
