import jwt from "jsonwebtoken";
import md5 from "md5";
import knex from "../config/mysql_db.js";
import constants from "../helpers/constants.js";
import model from "../model/role.js";
import fun from "../helpers/functions.js";
import validation from "../validation/role.js";

const updateRole = async (req, res) => {
  try {
    // if(!req.validate("roles", "update")){
    //    return false
    // }
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { role_name, permissions, id } = req.body;
    const data = {
      role_name,
      permissions,
    };
    const update = await model.updateRole(id, data);
    if (update) {
      return res.json({
        error: false,
        message: "Role has been updated",
      });
    }
    return res.json({
      error: true,
      message: "Failed to Update role",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const createRole = async (req, res) => {
  // try {
    // if(!req.validate("roles", "create")){
    //    return false
    // }


    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { role_name, permissions } = req.body;
    const data = {
      role_name,
      permissions,
    };
    const id = await model.insertRole(data);

    if (id <= 0) {
      return res.json({
        error: true,
        message: "Failed to Create Role",
        data: id,
      });
    }

    const getModules = await knex('modules').select('id').where('status',1)
    if(getModules.length <=0){
      return res.status(200).json({
        error: false,
        message: "Role has been created without default permissions",
        data: id,
      });  
    }
m
    const defaultPermissions = [0,0,0,0]
    let permission = []
    getModules.forEach((item,index)=>{
      permission.push({
        id:item.id,
        permission:defaultPermissions
      })
    })

    const addRolePermission = await knex("roles_permission").insert({
      role_id:id,
      module_permission:JSON.stringify(permission)
    })
    if(addRolePermission <=0){
      return res.status(200).json({
        error: false,
        message: "Role has been created without default permissions",
        data: id,
      }); 
    }

    return res.status(200).json({
      error: false,
      message: "Role has been created with default permissions",
      data: id,
    });
   
  // } catch (error) {
  //   fun.sendErrorLog(req, error);
  //   return res.json({
  //     error: true,
  //     message: "Something went wrong.",
  //     data: { error: JSON.stringify(error) },
  //   });
  // }
};

const paginateRole = async (req, res) => {
  try {
    console.log("hp");
    // if(!req.validate("roles", "read")){
    //     return false
    // }
    let {
      offset = 0,
      limit = 10,
      order = "asc",
      sort = "id",
      search,
      status,
    } = req.body;

    let searchFrom = ["role_name", "role_key"];
    const total = await model.paginatRoleTotal(searchFrom, search, status);

    const rows = await model.paginatRole(
      limit,
      offset,
      searchFrom,
      status,
      sort,
      search,
      order
    );
    // rows = rows.map(row => {
    //     row.image = constants.getStaticUrl(row.image)
    //     return row
    // })
    let data_rows = [];
    if (order === "asc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "Role received successfully.",
      data: {
        rows: data_rows,
        total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    // if(!req.validate("roles", "delete")){
    //    return false
    // }
    const { error, value } = validation.del(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = req.body;
    const data = await knex("users")
      .where({ role: id })
      .count("id as total")
      .where("status", "!=", 2)
      .first();
    // console.log(data.total)
    // return
    if (data.total > 0) {
      return res.json({
        error: true,
        message: "There are users already associated with this Role.",
      });
    } else if ([1, 2].includes(id)) {
      return res.json({
        error: true,
        message: "Sorry you can not delete this role.",
      });
    }
    const status = await model.deleteRole(id);

    if (status) {
      return res.json({
        error: false,
        message: "Role has been deleted",
      });
    }
    return res.json({
      error: true,
      message: "Failed to Delete Role",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const getRoleDetail = async (req, res) => {
  try {
    // if(!req.validate("roles", "read")){
    //    return false
    // }

    const { error, value } = validation.view(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = req.body;
    const data = await model.getRoleDetail({ id: id });
    if (data.length) {
      return res.json({
        error: false,
        message: "success. Role details receive",
        data: data,
      });
    } else {
      return res.json({
        error: false,
        message: "sorry. no record found",
        data: [],
      });
    }
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const getModules = async (req, res) => {
  try {
    // if (!req.validate("admin", "read")) {
    //     return false
    // }
      const { error, value } = validation.getModule(req.body);
      if (error) {
        return res.status(400).json({
          error: true,
          message: error.details[0].message,
        });
      }

    const { role_id = -1 } = req.body;
    let data = await knex("users_roles as ar")
      .leftJoin("users_roles_permissions as rp", "ar.id", "rp.role_id")
      .leftJoin("modules as m", "m.id", "rp.module_id")
      .where("ar.id", "=", role_id)
      .select(
        "m.module_key",
        "rp.createP as create",
        "rp.updateP as update",
        "rp.deleteP as delete",
        "rp.readP as read",
        "ar.role_name"
      );
    let role_name = "";
    if (data.length && data.length != 0) {
      role_name = data[0].role_name;
    }
    let permissions = data.map((val) => {
      delete val.role_name;
      Object.keys(val).map((data) => {
        if (data != "module_key") {
          if (val[data] == "1") {
            val[data] = true;
          } else {
            val[data] = false;
          }
        }
      });
      return val;
    });
    const modules = await knex("pages").select(
      "pages.*",
      "pages.name as module_key"
    );
    return res.json({
      error: false,
      message: "Modules recieved successfully",
      data: {
        modules,
        permissions,
        role_name,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

export default {
  createRole,
  paginateRole,
  updateRole,
  deleteRole,
  getRoleDetail,
  getModules,
};
