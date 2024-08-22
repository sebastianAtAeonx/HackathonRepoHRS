import Joi from "joi";
import {
  nameSchema,
  idSchema,
  paginationSchema,
  statusSchema
} from "../../../src/validation/generalValidation.js";

// Define the schema for permissions
const permissionsSchema = Joi.object({
  read: Joi.number().integer().min(0).max(1).required(),
  create: Joi.number().integer().min(0).max(1).required(),
  update: Joi.number().integer().min(0).max(1).required(),
  delete: Joi.number().integer().min(0).max(1).required(),
  navView:Joi.number().integer().min(0).max(1).required()
});

// Define the schema for module_permissions
const modulePermissionsSchema = Joi.object({
  module_id: idSchema.required(),
  permissions: permissionsSchema.required()
});

// Define the schema for the createRole function
const createRoleSchema = Joi.object({
  name: nameSchema.required(),
  module_permissions: Joi.array().items(modulePermissionsSchema).optional()
})
  .options({ abortEarly: true })
  .unknown(true);

const updateRoleSchema = Joi.object({
  name: nameSchema.optional(),
  status: statusSchema.default(1),
  module_permissions: Joi.array().items(modulePermissionsSchema).optional()
})
  .options({ abortEarly: true })
  .unknown(true);

const createRole = (data) => {
  return createRoleSchema.validate(data);
};

const updateRole = (data) => {
  return updateRoleSchema.validate(data);
}

const deleteRole = (data) => {
  const joiSchema = Joi.object({
    id: idSchema
  })
    .options({ abortEarly: true })
    .unknown(true);

  return joiSchema.validate(data);
};

const paginateRole = (data) => {
  const schemaWithStatus = paginationSchema.keys({
    status: statusSchema,
    role_id: Joi.number().allow("", null).default(null)
  });

  return schemaWithStatus.validate(data);
};

export default {
  createRole,
  deleteRole,
  paginateRole,
  updateRole
};
