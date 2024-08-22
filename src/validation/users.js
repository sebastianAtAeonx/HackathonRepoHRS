import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().trim(),
    firstname: Joi.string().required().trim(),
    lastname: Joi.string().required().trim(),
    email: Joi.string().email({
      tlds: {
        allow: false,
      },
    }),
    password: Joi.string().min(6).max(35).required(),
    status: Joi.number().allow("0", "1", "").default("1"),
    role: Joi.number().required(),
    // role_id : Joi.number().required(),
    location: Joi.string().optional().allow(""),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
    role: Joi.string().allow("", null).default(null), // New role filter
    department: Joi.string().allow("", null).default(null), // New department filter
    roleName: Joi.string().allow("", null).default(null),
  });

  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    username: Joi.string().required().trim(),
    firstname: Joi.string().required().trim(),
    lastname: Joi.string().required().trim(),
    email: Joi.string().email({
      tlds: {
        allow: false,
      },
    }),
    password: Joi.string().min(6).max(35).required(),
    status: Joi.string().valid("0", "1").required(),
    role: Joi.number().required(),
    location: Joi.string().optional().allow(""),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });

  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const updateProfile = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    username: Joi.string().alphanum().required().trim(),
    firstname: Joi.string().alphanum().required().trim(),
    lastname: Joi.string().alphanum().required().trim(),
    email: Joi.string().email({
      tlds: {
        allow: false,
      },
    }),
    status: Joi.number().required(),
  });
  return schema.validate(data);
};

const changePassword = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    email: Joi.string().required(),
    old_password: Joi.string(),
    new_password: Joi.string().min(8).max(18).required(),
  });
  return schema.validate(data);
};

const allUserActivity = (data) => {
  const schema = Joi.object({
    offset: Joi.number().required(),
    limit: Joi.number().required(),
    sort: Joi.string().valid("userId", "emailId").default("userId"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const newAllUserActivity = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(10),
    sort: Joi.string().default("timestamp"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(null),
    filter: Joi.object({
      startDate: Joi.date().iso().optional().allow(""),
      endDate: Joi.date().iso().optional().allow(""),
      dateField: Joi.string()
        .valid("timestamp")
        .allow("", null)
        .default("timestamp"),
    }).optional(),
  });
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  updateProfile,
  changePassword,
  allUserActivity,
  newAllUserActivity,
};
