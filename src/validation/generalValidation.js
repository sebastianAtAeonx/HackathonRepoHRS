import Joi from "joi";

const idSchema = Joi.number().required();
const codeSchema = Joi.string().trim().required();
const nameSchema = Joi.string().trim().required();
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .messages({
    "string.empty": `"email" is a required field.`,
    "string.email": `Enter a valid email address`,
  });

const statusSchema = Joi.string().valid("0", "1").optional();
const paginationSchema = Joi.object({
  offset: Joi.number().default(0),
  limit: Joi.number().default(50),
  sort: Joi.string().default("id"),
  order: Joi.string().valid("asc", "desc").default("desc"),
  search: Joi.string().allow("", null).default(null),
});

export {
  idSchema,
  codeSchema,
  nameSchema,
  paginationSchema,
  emailSchema,
  statusSchema,
};
