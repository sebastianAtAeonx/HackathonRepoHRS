import Joi from "joi";

const createValidateUser = (create_data) => {
  const JoiSchema = Joi.object({
    firstname: Joi.string().trim().min(1).max(255).required().messages({
      "string.empty": `"firstname" is a required field.`,
      "string.length": `"firstname" must contain 255 characters`,
    }),
    lastname: Joi.string().trim().min(1).max(255).required().messages({
      "string.empty": `"lastname" is a required field.`,
      "string.length": `"lastname" must contain 255 characters`,
    }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.empty": `"email" is a required field.`,
        "email.base": `enter valid "email"`,
      }),
    password: Joi.string().trim().min(1).max(35).required().messages({
      "string.empty": `"password" is a required field.`,
      "string.length": `"password" must contain 35 characters`,
    }),
    role: Joi.number().required().messages({
      "number.empty": `"Role" is a required field.`,
      "number.base": `"Role" must be a number.`,
    }),
    status: Joi.number().required().messages({
      "number.empty": `"Status" is a required field.`,
      "number.base": `"Status" must be a number.`,
    }),
  }).options({ abortEarly: false });

  return JoiSchema.validate(create_data);
};

const validateUpdateUser = (update_data) => {
  const JoiSchema = Joi.object({
    id: Joi.number().required().label("id"),
    firstname: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .required()
      .label("first name"),
    lastname: Joi.string().trim().min(1).max(255).required().label("last name"),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .label("Email"),
    role: Joi.number().required().messages({
      "number.empty": `"Role" is a required field.`,
      "number.base": `"Role" must be a number.`,
    }),
    status: Joi.number().required().label("status"),
    password: Joi.any().optional().label("password"),
  }).options({ abortEarly: false });

  return JoiSchema.validate(update_data);
};

const idValidateLocation = (course_data) => {
  const JoiSchema = Joi.object({
    id: Joi.number().required().label("Location id"),
  }).options({ abortEarly: false });

  return JoiSchema.validate(course_data);
};

export default {
  createValidateUser,
  validateUpdateUser,
  idValidateLocation,
};
