import Joi from "joi";

const supplierProducts = (data) => {
    const schema = Joi.object({
        supplierId: Joi.string().required(),
      });
  return schema.validate(data);
};

export default {
  supplierProducts,
};
