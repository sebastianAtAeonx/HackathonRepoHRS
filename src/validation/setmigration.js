import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    hostAddress: Joi.string().required().trim(),
    databaseName: Joi.string().required().trim(),
    userName: Joi.string().required().trim(),
    password: Joi.string().allow("").default("").trim(),
    portNo: Joi.number().allow("").default("3306"),
  });
  return schema.validate(data);
};

export default {
  create,
};
