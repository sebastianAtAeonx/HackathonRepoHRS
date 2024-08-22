import knex from "../../config/mysql_db.js";
import validation from "../../validation/admin/roles.js";
import functions from "../../helpers/functions.js";
import commonResponse from "../../helpers/responses.js";
import response from "../../responses/admin/roles.js";

const tableName = "role";

const createRole = async (req, res) => {
  try {
  const { error, value } = validation.createRole(req.body);
  if (error) {
    return commonResponse.validateErrorResponse(
      res,
      400,
      error.details.map((detail) => detail.message).join(", ")
    );
  }
  await functions.validateField(tableName, "name", value.name, "Name");
  const [roleId] = await knex(tableName).insert({
    name: value.name,
  });

  if (value.module_permissions && value.module_permissions.length > 0) {
    const permissionsData = value.module_permissions.map(
      (modulePermission) => ({
        readP: modulePermission.permissions.read,
        createP: modulePermission.permissions.create,
        updateP: modulePermission.permissions.update,
        deleteP: modulePermission.permissions.delete,
        navView: modulePermission.permissions.navView,
        role_id: roleId,
        module_id: modulePermission.module_id,
      })
    );
    await knex("permission").insert(permissionsData);
  }
  return commonResponse.successResponse(res, 201, "Role created successfully", {
    role_id: roleId,
  });
  } catch (error) {
      if (error) {
          return commonResponse.validateErrorResponse(res, 409, error.message);
      } else {
          return commonResponse.errorResponse(res, 500, "An error occurred while creating the business type", error.message);
      }
  }
};

const updateRole = async (req, res) => {
  const { id } = req.params;
  let record;
  try {
    record = await functions.getRecordById(tableName, "id", id);
    const { error, value } = validation.updateRole(req.body);
    if (error) {
      return commonResponse.validateErrorResponse(
        res,
        400,
        error.details.map((detail) => detail.message).join(", ")
      );
    }
    if (record.name !== value.name) {
      await functions.validateField(tableName, "name", value.name, "Name");
    }
    await knex.transaction(async (trx) => {
      await trx(tableName).where("id", id).update({ name: value.name });

      await trx("permission").where("role_id", id).del();

      if (value.module_permissions && value.module_permissions.length > 0) {
        const permissionsData = value.module_permissions.map(
          (modulePermission) => ({
            readP: modulePermission.permissions.read,
            createP: modulePermission.permissions.create,
            updateP: modulePermission.permissions.update,
            deleteP: modulePermission.permissions.delete,
            navView: modulePermission.permissions.navView,
            module_id: modulePermission.module_id,
            role_id: id,
          })
        );

        await trx("permission").insert(permissionsData);
      }
    });

    return commonResponse.successResponse(
      res,
      200,
      "Role updated successfully",
      { role_id: id }
    );
  } catch (error) {
    if (
      error.message.includes(
        `Record with id ${id} does not exist in ${tableName}`
      )
    ) {
      return commonResponse.validateErrorResponse(res, 404, error.message);
    }
    if (error.details) {
      return commonResponse.validateErrorResponse(
        res,
        400,
        error.details.map((detail) => detail.message).join(", ")
      );
    }
    if (error.message.includes("Name already exists")) {
      return commonResponse.validateErrorResponse(res, 409, error.message);
    }
    return commonResponse.errorResponse(
      res,
      500,
      "An error occurred while updating the role",
      error.message
    );
  }
};

const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    const { error, value } = validation.deleteRole(req.params);
    await functions.getRecordById(tableName, "id", id);
    if (error) {
      return commonResponse.validateErrorResponse(
        res,
        400,
        error.details.map((detail) => detail.message).join(", ")
      );
    }

    await knex("users")
      .where({
        role_id: value.id,
      })
      .update({
        role_id: null,
      });
    await knex("permission").where({ role_id: value.id }).del();

    const data = await knex(tableName).where({ id: value.id }).del();

    return commonResponse.successResponse(
      res,
      200,
      "Role deleted successfully",
      data
    );
  } catch (error) {
    if (
      error.message.includes(
        `Record with id ${id} does not exist in ${tableName}`
      )
    ) {
      return commonResponse.validateErrorResponse(res, 404, error.message);
    }
    return commonResponse.errorResponse(
      res,
      500,
      "An error occurred while deleting the Role",
      error.message
    );
  }
};

// const paginateRole = async (req, res) => {
//     try {
//         const searchFrom = ["role.name"];
//         const validSortColumns = ["role.id", "role.name"];
//         const { error, value } = validation.paginateRole(req.body);
//         if (error) {
//             return commonResponse.validateErrorResponse(res, 400, error.details.map((detail) => detail.message).join(", "));
//         }

//         const { offset, limit, order, sort: sortBy, search, role_id } = value;
//         const sort = validSortColumns.includes(sortBy) ? sortBy : "role.id";

//         const buildSearchQuery = (query) => {
//             if (search) {
//                 searchFrom.forEach((column) => {
//                     query.orWhereILike(column, `%${search}%`);
//                 });
//             }
//         };

//         let baseQuery = knex("role")
//             .leftJoin("permission", "role.id", "permission.role_id")
//             .leftJoin("module", "permission.module_id", "module.id")

//         if (role_id) {
//             baseQuery = baseQuery.andWhere({ "role.id": role_id });
//         }

//         buildSearchQuery(baseQuery);

//         const totalResult = await baseQuery.clone().count("role.id as total").first();
//         const total = totalResult ? totalResult.total : 0;

//         const rows = await baseQuery
//             .clone()
//             .select("role.*", "permission.*", "module.name")
//             .orderBy(sort, order)
//             .limit(limit)
//             .offset(offset);

//         const dataRows = rows.map((row, index) => {
//             row.sr = order === "desc" ? offset + index + 1 : total - limit * offset - index;
//             return response.roleResponse(row);
//         });

//         const data = {
//             total,
//             rows: dataRows,
//         };

//         return commonResponse.successResponse(res, 200, "Retrieved successfully.", data);
//     } catch (error) {
//         return commonResponse.errorResponse(res, 500, "An error occurred while fetching the roles", error.message);
//     }
// };

const listRoles = async (req, res) => {
  try {
    const { role_id: roleId } = req.body;

    // Build the base query
    let query = knex("role")
      .leftJoin("permission", "role.id", "permission.role_id")
      .leftJoin("module", "permission.module_id", "module.id")
      .select(
        "role.id as role_id",
        "role.name as role_name",
        "role.slug as role_slug",
        "role.created_at as role_created_at",
        "role.updated_at as role_updated_at",
        "module.id as module_id",
        "module.name as module_name",
        "module.slug as module_slug",
        "module.parent_id as module_parent_id",
        "permission.createP",
        "permission.readP",
        "permission.updateP",
        "permission.deleteP",
        "permission.navView"
      );

    // If roleId is provided, add a where clause
    if (roleId) {
      query = query.where("role.id", roleId);
    }

    const rawDatas = await query;

    const roles = rawDatas.reduce((acc, data) => {
      const {
        role_id,
        role_name,
        module_id,
        module_name,
        createP,
        readP,
        updateP,
        deleteP,
        navView,
      } = data;

      if (!acc[role_id]) {
        acc[role_id] = {
          id: role_id,
          name: role_name,
          modules: {},
        };
      }

      if (module_id) {
        if (!acc[role_id].modules[module_id]) {
          acc[role_id].modules[module_id] = {
            id: module_id,
            name: module_name,
            permissions: {},
          };
        }

        acc[role_id].modules[module_id].permissions = {
          create: createP,
          read: readP,
          update: updateP,
          delete: deleteP,
          navView: navView,
        };
      }

      return acc;
    }, {});

    const formattedData = Object.values(roles).map((role) => ({
      ...role,
      modules: Object.values(role.modules),
    }));

    return commonResponse.successResponse(
      res,
      200,
      "Retrieved successfully.",
      formattedData
    );
  } catch (error) {
    console.log("called", error);
    return commonResponse.errorResponse(res, 500, "Error retrieving data.");
  }
};

const getPermissions = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId, "user");
    const user = await knex("users").where({ id: userId }).first();
    const role_id = user.role_id;

    const permissions = await knex("permission")
      .leftJoin("module", "permission.module_id", "module.id")
      .where({ "permission.role_id": role_id,"navView":1 })
      .select(
        "permission.*",
        "module.name as module_name",
        "module.parent_id",
        "module.id as module_id"
      );


    const moduleMap = {};

    for (const perm of permissions) {
      const { module_id, parent_id, module_name } = perm;
      if (!moduleMap[module_id]) {
        moduleMap[module_id] = {
          module_id,
          name: module_name,
          permissions: [],
          subMenu: [],
        };
      }

      const modulePermissions = [];
      if (perm.createP) modulePermissions.push("create");
      if (perm.readP) modulePermissions.push("read");
      if (perm.updateP) modulePermissions.push("update");
      if (perm.deleteP) modulePermissions.push("delete");
      if (perm.navView) modulePermissions.push("navView");

      moduleMap[module_id].permissions = [
        ...new Set([...moduleMap[module_id].permissions, ...modulePermissions]),
      ];

      if (parent_id) {
        if (!moduleMap[parent_id]) {
          const parentModule = await knex("module")
            .where({ id: parent_id })
            .select("name")
            .first();
          moduleMap[parent_id] = {
            module_id: parent_id,
            name: parentModule.name,
            permissions: [],
            subMenu: [],
          };
        }
        const submoduleExists = moduleMap[parent_id].subMenu.some(
          (sub) => sub.module_id === module_id
        );
        if (!submoduleExists) {
          moduleMap[parent_id].subMenu.push(moduleMap[module_id]);
        }
      }
    }

    const submoduleIds = new Set();
    const response = Object.values(moduleMap)
      .filter((module) => {
        module.subMenu.forEach((sub) => submoduleIds.add(sub.module_id));
        if (submoduleIds.has(module.module_id)) {
          return false;
        }
        return module.subMenu.length > 0 || module.permissions.length > 0;
      })
      .map((module) => {
        module.subMenu = module.subMenu.filter(
          (sub) => sub.permissions.length > 0
        );

        return {
          ...module,
          subMenu: module.subMenu.length > 0 ? module.subMenu : undefined,
          permissions:
            module.permissions.length > 0 ? module.permissions : undefined,
        };
      })
      .filter(
        (module) =>
          module.permissions || (module.subMenu && module.subMenu.length > 0)
      );

    return commonResponse.successResponse(
      res,
      200,
      "Retrieved successfully.",
      response
    );
  } catch (error) {
    return commonResponse.errorResponse(
      res,
      500,
      "An error occurred while fetching the permissions",
      error.message
    );
  }
};

const getRoles = async (req, res) => {
  try {
    const rolesData = await knex("role")
      .leftJoin("users", "role.id", "users.role_id")
      .select("role.*", "users.id as user_id");

    const roleMap = new Map();

    rolesData.forEach((role) => {
      if (!roleMap.has(role.id)) {
        roleMap.set(role.id, {
          id: role.id,
          role_name: role.name,
          status: "1",
          approver_level: role.approver_level || null,
          modifiedBy: null,
          created_at: role.created_at,
          updated_at: role.updated_at,
          totalUsers: 0,
          sr: roleMap.size + 1,
        });
      }
      if (role.user_id) {
        roleMap.get(role.id).totalUsers += 1;
      }
    });

    const roles = Array.from(roleMap.values());

    return commonResponse.successResponse(res, 200, "Retrieved successfully.", {
      rows: roles,
      total: roles.length,
    });
  } catch (error) {
    return commonResponse.errorResponse(
      res,
      500,
      "An error occurred while fetching the roles",
      error.message
    );
  }
};

export default {
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getRoles,
  listRoles,
};
