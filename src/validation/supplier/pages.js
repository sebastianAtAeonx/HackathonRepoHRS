import Joi from "joi";

const view = (data) => {
  const schema = Joi.object({
    pannel_id: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

export default {
  view,
};
