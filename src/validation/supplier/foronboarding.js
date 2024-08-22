import Joi from "joi";

const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().uuid(),
  });

  return schema.validate(data);
};

export default {
  view,
};
