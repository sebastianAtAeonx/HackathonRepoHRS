import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/rolesAndPermissions.js";

const createRolePermission = async (req, res) => {
  try {
    const table = "roles_permissions";

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { role_id, module_permissions } = value;
    //check duplication
    const check = await knex(table).where({ role_id: role_id });
    if (check.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Role permissions already exists.",
      });
    }

    let ids = [];

    module_permissions.map((item) => {
      ids.push(item.id);
    });

    const module_keys = await knex("modules")
      .whereIn("id", ids)
      .select("module_key");
    if (module_keys.length != ids.length) {
      return res.json({
        error: true,
        message: "Module not found.",
      });
    }

    const insert = await knex(table).insert({
      role_id: role_id,
      module_permission: { module_permissions },
    });
    if (insert.length == 0) {
      return res.status(500).json({
        error: true,
        message: "failed to insert.",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Inserted succesfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteRolePermission = async (req, res) => {
  try {
    const tableName = "roles_permissions";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check = await knex(tableName)
      .where({
        id: id,
      })
      .del();
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete Failed.",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const updateRolePermission = async (req, res) => {
  try {
    const table = "roles_permissions";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { role_id, module_permissions } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check = await knex(table).where({ role_id: role_id });
    if (check.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Role permissions does not exist.",
      });
    }

    check[0].module_permission = JSON.parse(check[0].module_permission);
    const temp = check[0].module_permission.module_permissions;

    if (
      temp.length < module_permissions.length ||
      temp.length > module_permissions.length
    ) {
      return res.json({
        error: true,
        message: "Module Permission is not equals to old.",
      });
    }

    let ids = [];

    module_permissions.map((item, index) => {
      ids.push(item.id);
      delete module_permissions[index].name;
    });

    const module_keys = await knex("modules")
      .whereIn("id", ids)
      .select("module_key");
    if (module_keys.length != ids.length) {
      return res.status(404).json({
        error: true,
        message: "Module not found.",
      });
    }

    const getRecord = await knex(table)
      .where({ role_id: role_id })
      .select("id")
      .first();

    const updationDataIs = await functions.takeSnapShot(table, getRecord.id);

    const updateRolePermission = await knex(table)
      .update({
        role_id: role_id,
        module_permission: JSON.stringify({ module_permissions }),
      })
      .where("role_id", role_id);

    if (updateRolePermission <= 0) {
      return res.status(500).json({
        error: true,
        message: "Failed to update role permissions",
      });
    }

    if (role_id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "roles_permissions",
        "role_id",
        role_id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }

    return res.status(200).json({
      error: false,
      message: "Role Permissions updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const viewRolePermission = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { role_id } = value;

    const getRole = await knex("users_roles").where({ id: role_id });
    if (getRole.length <= 0) {
      return {
        error: true,
        message: "Role does not exist.",
      };
    }

    const getPermissions = await knex("roles_permissions").where({
      role_id: role_id,
    });
    if (getPermissions.length <= 0) {
      return {
        error: true,
        message: "This role have no permissions.",
      };
    }

    delete getPermissions[0].created_at;
    delete getPermissions[0].updated_at;

    getPermissions[0].module_permission = JSON.parse(
      getPermissions[0].module_permission
    );

    getPermissions[0].module_permission =
      getPermissions[0].module_permission.module_permissions;

    let ids = [];

    getPermissions[0].module_permission.map((item) => {
      ids.push(item.id);
    });

    const module_keys = await knex("modules")
      .whereIn("id", ids)
      .select("module_key");
    if (module_keys.length != ids.length) {
      return res.json({
        error: true,
        message: "Module not found.",
      });
    }

    getPermissions[0].module_permission.map((item, index) => {
      getPermissions[0].module_permission[index].name =
        module_keys[index].module_key;
      //  delete getPermissions[0].module_permission[index].id;
    });

    return res.status(200).json({
      error: false,
      message: "Data fetched Successfully",
      data: getPermissions[0],
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "roles_permissions";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

export default {
  createRolePermission,
  deleteRolePermission,
  updateRolePermission,
  viewRolePermission,
  delteMultipleRecords,
};
