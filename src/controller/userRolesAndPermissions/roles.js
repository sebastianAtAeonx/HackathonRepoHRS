import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/userRolesAndPermissions/roles.js";

const deleteRoles = async (req, res) => {
  try {
    const tableName = "users_roles";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id } = value;
    const deleteRolePermission = await knex("roles_permissions")
      .where({
        role_id: id,
      })
      .del();
    if (!deleteRolePermission) {
      return res.json({
        error: true,
        message: "Role Permission Delete Failed.",
      });
    }
    const check = await knex(tableName)
      .where({
        id: id,
      })
      .del();
    if (!check) {
      return res.json({
        error: true,
        message: "Delete Failed.",
      });
    }
    return res.json({
      error: false,
      message: "Deleted Successfully.",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const viewRoles = async (req, res) => {
  try {
    const tableName = "users_roles";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({
      id,
    });
    if (result == "") {
      return res.json({
        error: true,
        message: "Record not found",
      });
    }
    return res.json({
      error: false,
      message: "Record found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const createRoles = async (req, res) => {
  try {

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { role_name, status, module_permissions } = value;

    const checkname = await knex("users_roles").where({
      role_name: role_name,
    });

    if (checkname.length > 0) {
      return res.json({
        error: true,
        message: "This name is already exist",
      });
    }

    const id = uuidv4();
    const created_at = knex.fn.now();

    const data = knex("modules");

    let getModules;

    await data
      .then((result) => {
        getModules = result;
      })
      .catch((err) => {
        getModules = null;
      });

    if (getModules.length != module_permissions.length) {
      return res.json({
        error: true,
        message: "Modules does not match.",
      });
    }

    const result = await knex("users_roles").insert({
      role_name,
      status,
      created_at,
    });

    if (!result) {
      return res.json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }

    module_permissions.forEach((i, index) => {
      delete module_permissions[index].module_key;
    });

    const addRolePermission = await knex("roles_permissions").insert({
      role_id: result[0],
      module_permission: { module_permissions: module_permissions },
    });
    if (addRolePermission <= 0) {
      return res.status(200).json({
        error: false,
        message: "Role has been created without permissions",
        data: result,
      });
    }

    return res.json({
      error: false,
      message: "Added successfully with permissions.",
      data: {
        insertId: result,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updateRoles = async (req, res) => {
  try {

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { role_name, id, status } = value;
    const updated_at = knex.fn.now();

    const resultx = await knex("users_roles")
      .where({
        role_name: role_name,
      })
      .where("id", "!=", id);
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.json({
        error: true,
        message: "Record with this Name is already exist",
      });
    }

    const updationDataIs = await functions.takeSnapShot("users_roles",id);

    const result = await knex("users_roles")
      .where({
        id: id,
      })
      .update({
        role_name: role_name,
        status,
        updated_at,
      });

    if (Array.isArray(result) && result.length <= 0) {
      return res.json({
        error: true,
        message: "User role does not exist",
      });
    }
if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(
      req.headers["authorization"],
      "users_roles",
      "id",
      id
    );
    console.log("isUpdated:-", modifiedByTable1);
  }
    return res.json({
      error: false,
      message: "Updated successfully.",
      data: {
        updatedId: id,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const paginateRoles = async (req, res) => {
  try {
    console.log("123");
    const tableName = "users_roles";
    const searchFrom = ["role_name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status, key } = value;

    let total = 0;
    let results;
    if (key == 1) {
      results = knex(tableName);
    } else {
      results = knex(tableName).whereNot("role_name", "Admin");
    }

    if (status != undefined && status != "") {
      total = results.where("status", status);
    }
    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    total = await results.count("id as total").first();
    let rows;
    if (key == 1) {
      rows = knex(tableName);
    } else {
      rows = knex(tableName).whereNot("role_name", "Admin");
    }

    if (status != undefined && status != "") {
      rows.where("status", status);
    }
    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

    for (const currentrow of rows) {
      const countRoleUsers = await knex("users").where(
        "role",
        "=",
        currentrow.id
      );
      currentrow.totalUsers = countRoleUsers.length;
    }

    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const roleList = async (req, res) => {
  try {
    const roles = await knex("users_roles").select("role_name");

    const result = await knex.raw(
      "SELECT users.id, users.firstname, users.username,users.lastname, users_roles.id AS role_id, users_roles.role_name " +
        "FROM users " +
        "JOIN users_roles ON users.role = users_roles.id " +
        "WHERE ROLE IN(SELECT distinct users_roles.id " +
        "FROM users_roles) ORDER BY users_roles.id"
    );

    const roleData = {};

    roles.forEach((role) => {
      roleData[role.role_name] = [];
    });

    result[0].forEach((entry) => {
      if (roleData[entry.role_name]) {
        roleData[entry.role_name].push(entry);
      }
    });

    return res.json({
      error: false,
      message: "Here is role list",
      roles: roleData,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const rolesAre = async (req, res) => {
  try {
    const result = await knex("users_roles").where("status", "1");

    if (result.length == 0) {
      return res.json({
        error: true,
        message: "There are no roles exist",
      });
    }

    return res.json({
      error: false,
      message: "Roles are retrived Successfully",
      data: result,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "users_roles";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
      });
    }
  
    return res.json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.json({
        error: true,
        message: "Something went wrong",
        data: JSON.stringify(error),
      });
    }
}

export default {
  createRoles,
  updateRoles,
  viewRoles,
  deleteRoles,
  paginateRoles,
  roleList,
  rolesAre,
  delteMultipleRecords
};
