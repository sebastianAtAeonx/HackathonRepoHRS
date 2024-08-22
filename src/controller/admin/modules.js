import Joi from "joi";
import knex from "../../config/mysql_db.js";
import validation from "../../validation/admin/modules.js";

const paginateModules = async (req, res) => {
  try {
    const tableName = "module";
    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let { offset, limit, order, sort, search, status } = value;
    let results = await knex(tableName).whereNotNull("parent_id");
    const getDash = await knex(tableName)
      .where("name", "Dashboard")
      .select()
      .first();
    // const getSuppliers=await knex(tableName).where("name", "Supplier Details").select().first()
    // const getSupplierList=await knex(tableName).where("name", "Suppliers List").select().first()
    results.push(getDash);
    // results.push(getSuppliers)
    // results.push(getSupplierList)
    res.status(200).json({
      error: false,
      message: "Data retrieved successfully.",
      data: {
        total: results.length,
        rows: results,
      },
    });
  } catch (error) {
    return res
      .json({
        error: true,
        message: "Something went wrong",
      })
      .end();
  }
};

// const paginateModules = async (req, res) => {
//   try {
//     const tableName = "module";
//     const searchFrom = ["name"];

//     const schema = Joi.object({
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(50),
//       sort: Joi.string().default("id"),
//       order: Joi.string().valid("asc", "desc").default("asc"),
//       status: Joi.string().valid("0", "1", "").default(""),
//       search: Joi.string().allow("", null).default(null),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     let { offset, limit, order, sort, search, status } = value;

//     // Fetch all modules
//     let modules = await knex(tableName).orderBy(sort, order);

//     // Organize modules into parent-child structure
//     let moduleMap = {};
//     modules.forEach(module => {
//       if (module.parent_id === null) {
//         // This is a parent module
//         moduleMap[module.id] = { ...module, children: [] };
//       }
//     });

//     modules.forEach(module => {
//       if (module.parent_id !== null && moduleMap[module.parent_id]) {
//         // This is a child module, add it to the corresponding parent
//         moduleMap[module.parent_id].children.push(module);
//       }
//     });

//     // Convert moduleMap to an array
//     let results = Object.values(moduleMap);

//     res.status(200).json({
//       error: false,
//       message: "Data retrieved successfully.",
//       data: {
//         total: results.length,
//         rows: results,
//       },
//     });
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Something went wrong",
//       })
//       .end();
//   }
// };

const createModule = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { name, parent_id } = value;
    const [moduleId] = await knex("module")
      .insert({ name, parent_id, slug: name })
      .returning("id");

    console.log(parent_id, "parent_id");
    if (parent_id !== undefined) {
      const roles = await knex("role").where({ status: 1 }).select();

      const permissions = roles.map((role) => ({
        role_id: role.id,
        module_id: moduleId,
        createP: role.name === "Admin" ? 1 : 0,
        readP: role.name === "Admin" ? 1 : 0,
        updateP: role.name === "Admin" ? 1 : 0,
        deleteP: role.name === "Admin" ? 1 : 0,
      }));

      await knex("permission").insert(permissions);
    }

    res.status(201).json({
      error: false,
      message: "Module created successfully.",
      data: moduleId,
    });
  } catch (error) {
    console.error("Error creating module and permissions:", error);
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not add record",
      })
      .end();
  }
};

const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "ID is required",
      });
    }

    const module = await knex("module").where({ id: id }).first();
    if (!module) {
      return res.status(404).json({
        error: true,
        message: "Module not found",
      });
    }

    await knex("permission").where({ module_id: id }).del();

    await knex("module").where({ id: id }).del();

    res.status(200).json({
      error: false,
      message: "Module and related permissions deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting module and permissions:", error);
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not delete module",
      })
      .end();
  }
};

// const createModule = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       name: Joi.string().required(),
//       parent_id: Joi.number(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     const { name, parent_id } = value;
//     const [moduleId] = await knex("module").insert({ name, parent_id, slug: name }).returning('id');
//     const roles = await knex("role").where({"status": 1}).select();

//     const permissions = await Promise.all(
//       roles.map(async (role) => {
//         const existingPermission = await knex("permission")
//           .where({ role_id: role.id, module_id: moduleId })
//           .first();

//         if (!existingPermission) {
//           return {
//             role_id: role.id,
//             module_id: moduleId,
//             createP: role.name === 'Admin' ? 1 : 0,
//             readP: role.name === 'Admin' ? 1 : 0,
//             updateP: role.name === 'Admin' ? 1 : 0,
//             deleteP: role.name === 'Admin' ? 1 : 0,
//           };
//         }
//         return null;
//       })
//     );

//     const filteredPermissions = permissions.filter((permission) => permission !== null);

//     if (filteredPermissions.length > 0) {
//       await knex("permission").insert(filteredPermissions);
//     }

//     res.status(201).json({
//       error: false,
//       message: "Module created successfully.",
//       data: moduleId,
//     });
//   } catch (error) {
//     console.error("Error creating module and permissions:", error);
//     return res
//       .status(500)
//       .json({
//         error: true,
//         message: "Could not add record",
//       })
//       .end();
//   }
// };

export default {
  paginateModules,
  createModule,
  deleteModule,
};
