import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/module.js";

const createModules = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { module_key, status } = value;
    // console.log(value);
    const data = { module_key, status };

    const check_module = await knex("modules").where({
      module_key: module_key,
    });
    // console.log(check_id);

    if (check_module.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Module already exists.",
      });
    }

    const insertModules = await knex("modules").insert({
      module_key,
      status,
    });
    if (!insertModules) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Unable to insert data",
        })
        .end();
    }

    const rolePermission = knex("roles_permissions").select(
      "role_id",
      "module_permission"
    );

    let rolePermissionData = [];
    await rolePermission
      .then((result) => {
        rolePermissionData = result;
      })
      .catch((err) => {
        return res.status(201).json({
          error: false,
          message: "Module created successfully",
          insertModules: insertModules[0],
        });
      });

    let ids = [];
    const insertData = {
      id: insertModules[0],
      permission: [0, 1, 0, 0],
    };

    const getAdminId = await knex("users_roles")
      .select("id")
      .where("role_name", "=", "Admin");
    let adminId = getAdminId[0].id || 0;
    let adminData = {
      id: insertModules[0],
      permission: [1, 1, 1, 1],
    };
    let module_permission = [];
    rolePermissionData.forEach((item, index) => {
      if (item.role_id == adminId) {
        ids.push(item.role_id);
        item.module_permission = JSON.parse(item.module_permission);
        item.module_permission.module_permissions.push(adminData);
        module_permission.push(item.module_permission.module_permissions);
      } else {
        ids.push(item.role_id);
        item.module_permission = JSON.parse(item.module_permission);
        item.module_permission.module_permissions.push(insertData);
        module_permission.push(item.module_permission.module_permissions);
      }
    });

    await knex.transaction(async (trx) => {
      const promise = ids.map((item, index) => {
        return trx("roles_permissions")
          .where({ role_id: item })
          .update({
            role_id: item,
            module_permission: JSON.stringify({
              module_permissions: module_permission[index],
            }),
          });
      });

      await Promise.all(promise);
    });

    return res.status(201).json({
      error: false,
      message: "Modules created successfully with update permission",
      insertModules: insertModules[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not create record.",
      })
      .end();
  }
};

const viewModules = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { id } = value;

    const result = await knex("modules").select().where({ id });
    if (result.length == 0) {
      return res
        .status(404)
        .json({
          error: true,
          message: "Records not found",
          data: error,
        })
        .end();
    }
    //
    return res
      .status(200)
      .json({
        error: false,
        message: "Modules found successfully",
        data: result,
      })
      .end();
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not fetch record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const updateModules = async (req, res) => {
  try {
    const tableName = "modules";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { id, module_key, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check_id = await knex("modules").where({
      id: id,
    });
    if (Array.isArray(check_id) && check_id.length <= 0) {
      res.status(400).json({
        error: true,
        message: "module does not exist",
      });
      return res.end();
    }
    const checkModules = await knex("modules").where({
      module_key: module_key,
    });

    if (checkModules.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Modules already exists.",
      });
    }

    const updationDataIs = await functions.takeSnapShot("modules", id);

    const updateModule = await knex("modules").where("id", id).update({
      module_key,
      status,
    });

    if (!updateModule) {
      return res
        .status(500)
        .json({
          error: true,
          message: "unable to update modules",
        })
        .end();
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "modules",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res
      .status(200)
      .json({
        error: false,
        message: "Modules updated successfully",
        updateModule: updateModule[0],
      })
      .end();
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not update record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const deleteModules = async (req, res) => {
  try {
    const tableName = "modules";

    const { error, value } = validation.del(req.params);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const deleteData = await knex("modules")
      .where({ id })
      .update("isDeleted", 1);
    console.log("deletedata", deleteData);
    if (deleteData <= 0) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    const rolePermission = knex("roles_permissions").select(
      "role_id",
      "module_permission"
    );

    let rolePermissionData = [];
    await rolePermission
      .then((result) => {
        rolePermissionData = result;
      })
      .catch((err) => {
        return res.status(200).json({
          error: false,
          message: "Record deleted successfully",
        });
      });

    let ids = [];
    let module_permission = [];
    rolePermissionData.forEach((item, index) => {
      ids.push(item.role_id);
      item.module_permission = JSON.parse(item.module_permission);
      module_permission.push(item.module_permission.module_permissions);
    });

    module_permission.forEach((item, index) => {
      item.forEach((data, index2) => {
        if (data.id == id) {
          module_permission[index].splice(index2, 1);
        }
      });
    });

    await knex.transaction(async (trx) => {
      const promise = ids.map((item, index) => {
        return trx("roles_permissions")
          .where({ role_id: item })
          .update({
            role_id: item,
            module_permission: JSON.stringify({
              module_permissions: module_permission[index],
            }),
          });
      });

      await Promise.all(promise);
    });

    return res.status(200).json({
      error: false,
      message: "Record deleted successfully and removed from permissions.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not delete record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const paginateModules = async (req, res) => {
  try {
    const tableName = "modules";
    const searchFrom = ["module_key"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let { offset, limit, order, sort, search, status } = value;
    let results = knex(tableName);

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

    let rows = knex(tableName);
    if (status != undefined && status != "") {
      rows.where("status", status);
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(element, `%${search}%`);
          });
        });
      }
    });

    //updated code
    // if (search != undefined && search != "") {
    //   rows.where(function () {
    //     searchFrom.forEach((element, index) => {
    //       if (index > 0) {
    //         this.orWhere(function () {
    //           this.orWhereILike(element, `%${search}%`);
    //         });
    //       }
    //       this.orWhereILike(element, `%${search}%`);
    //     });
    //   });
    // }
    console.log("hello", rows.toString());
    rows = await rows.orderBy(sort, order).offset(offset);
    let data_rows = [];
    console.log(data_rows);
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
    res.status(200).json({
      error: false,
      message: "Data retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not load record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "modules";
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
    return res.json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};
export default {
  createModules,
  viewModules,
  updateModules,
  deleteModules,
  paginateModules,
  delteMultipleRecords,
};
