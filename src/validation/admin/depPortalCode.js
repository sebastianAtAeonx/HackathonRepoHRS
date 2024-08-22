import Joi from "joi";

const filter = (data) => {
  const schema = Joi.object({
    dept_id: Joi.string(),
  });
  return schema.validate(data);
};

export default {
  filter,
};
