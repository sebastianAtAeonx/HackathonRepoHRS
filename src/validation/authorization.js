import Joi from "joi";

const login = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .messages({
        "string.empty": `"email" is a required field.`,
        "email.base": `enter valid "email"`,
      }),
    password: Joi.string().trim().required().messages({
      "string.empty": `"password" is a required field.`,
    }),
  });
  return schema.validate(data);
};

const changePassword = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    old_password: Joi.string().trim().required().messages({
      "string.empty": `"password" is a required field.`,
    }),
    new_password: Joi.string().trim().required().messages({
      "string.empty": `"password" is a required field.`,
    }),
    confirm_password: Joi.string().trim().required().messages({
      "string.empty": `"password" is a required field.`,
    }),
  });
  return schema.validate(data);
};

const logout = (data) => {
  const schema = Joi.object({
    email: Joi.string().trim().required(),
  });

  return schema.validate(data);
};

const forgotPassword = (data) => {
  const schema = Joi.object({
    email: Joi.string().trim().required().messages({
      "string.empty": `"Email" is a required field.`,
      "string.email": `"Email" must be a valid email address.`,
    }),
  });
  return schema.validate(data);
};

const getUser = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const changeForgotPass = (data) => {
  const schema = Joi.object({
    token: Joi.string().trim().required().messages({
      "string.empty": `"Token" is a required field.`,
    }),
    password: Joi.string().trim().required().messages({
      "string.empty": `"Password" is a required field.`,
    }),
    confirm_password: Joi.string().trim().required().messages({
      "string.empty": `"Confirm Password" is a required field.`,
    }),
  });
  return schema.validate(data);
};

const checkLinkExpiry = (data) => {
  const schema = Joi.object({
    token: Joi.string().trim().required().messages({
      "string.empty": `"Token" is a required field.`,
    }),
  });
  return schema.validate(data);
};

const changePasswordOnFirstLogin = (data) => {
  const schema = Joi.object({
    newEmail: Joi.string().email().trim().required().allow(null, ""),
    newPassword: Joi.string()
      .trim()
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
        )
      )
      .messages({
        "string.pattern.base":
          "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        "string.empty": "Password is required.",
      })
      .required(),
    confirmPassword: Joi.string()
      .trim()
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
        )
      )
      .messages({
        "string.pattern.base":
          "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        "string.empty": "Password is required.",
      })
      .required(),
  });
  return schema.validate(data);
};

const sendAdminOTP = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().trim().required(),
  });
  return schema.validate(data);
};

const verifyAdminOTP = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().trim().required(),
    otp: Joi.string().trim().required(),
  });
  return schema.validate(data);
};

export default {
  login,
  changePassword,
  logout,
  forgotPassword,
  getUser,
  changeForgotPass,
  checkLinkExpiry,
  changePasswordOnFirstLogin,
  sendAdminOTP,
  verifyAdminOTP,
};
