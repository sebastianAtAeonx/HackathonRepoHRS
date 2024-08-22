import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/services.js";

const tableName = "services";

const createService = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const check_code = await knex(tableName)
      .where({ code: value.code })
      .first();

    if (check_code) {
      return res.status(409).json({
        error: true,
        message: "Code already exist",
        data: [],
      });
    }
    const check_mtlgrp = await knex("material_group")
      .where({ id: value.material_grp_id })
      .first();

    if (!check_mtlgrp) {
      return res.status(404).json({
        error: true,
        message: "Material Group Not Found",
        data: [],
      });
    }
    const check_unit = await knex("units").where({ id: value.unit_id }).first();

    if (!check_unit) {
      return res.status(404).json({
        error: true,
        message: "Unit Not Found",
        data: [],
      });
    }

    const insert = await knex(tableName).insert(value);

    if (!insert) {
      return res.status(500).json({
        error: true,
        message: "Fail to inser record",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Record Inserted Successfully.",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error.message),
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const updationDataIs = await functions.takeSnapShot("services", value.id);
    try {
      await logs.logOldValues(tableName, value.id, value, req);
    } catch {
      console.log(error);
    }

    const check_mtlgrp = await knex("material_group")
      .where({ id: value.material_grp_id })
      .first();

    if (!check_mtlgrp) {
      return res.status(404).json({
        error: true,
        message: "Material Group Not Found",
        data: [],
      });
    }
    const check_unit = await knex("units").where({ id: value.unit_id }).first();

    if (!check_unit) {
      return res.status(404).json({
        error: true,
        message: "Unit Not Found",
        data: [],
      });
    }
    const update_record = await knex(tableName)
      .where("id", value.id)
      .update(value);

    if (!update_record) {
      return res.status(500).json({
        error: true,
        message: "Fail to update Record",
      });
    }
    if (value.id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "services",
        "id",
        value.id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Record updated successfully",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error.message),
    });
  }
};

const PaginationService = async (req, res) => {
  try {
    const searchFrom = [
      `${tableName}.name`,
      `${tableName}.code`,
      `${tableName}.description`,
      `material_group.name`,
    ];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let rows = knex(tableName)
      .select(
        `${tableName}.*`,
        "units.name as unit",
        "material_group.name as material_group"
      )
      .leftJoin("units", `${tableName}.unit_id`, "units.id")
      .leftJoin(
        "material_group",
        `${tableName}.material_grp_id`,
        "material_group.id"
      );

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

    const total = await rows.clone().count(`${tableName}.id as total`).first();
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

    let data_rows = [];
    let sr;
    if (order === "desc") {
      sr = offset + 1;
    } else {
      sr = total.total - limit * offset;
    }
    rows.map(async (row) => {
      const Delete = ["service_category"];

      for (const key of Delete) {
        delete row[key];
      }
      row.sr = sr;
      if (order == "desc") {
        sr++;
      } else {
        sr--;
      }
      data_rows.push(row);
    });

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error.message),
    });
  }
};

// const createService = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       code: Joi.string().required().trim(),
//       name: Joi.string().required().trim(),
//       description: Joi.string().required().trim(),
//       price: Joi.number().required(),
//       status: Joi.string().valid("0", "1").default("1"),
//       is_recursive: Joi.string().valid("0", "1").default("1"),
//       is_tax_included: Joi.string().valid("0", "1").default("1"),
//       recurring_days: Joi.number().required(),
//       cost_price: Joi.number().required(),
//       recurring_price: Joi.number().required(),
//       unit_id: Joi.string().trim(),
//     });

//     const { error, value } = schema.validate(req.body);

//     if (error) {
//       return res.json({
//         error: true,
//         data: error.details[0].message,
//       });
//     }

//     const {
//       code,
//       name,
//       description,
//       price,
//       status,
//       is_recursive,
//       is_tax_included,
//       recurring_days,
//       cost_price,
//       recurring_price,
//       unit_id,
//     } = value;

//     const insert_record = await knex("services").insert({
//       code,
//       name,
//       description,
//       price,
//       status,
//       is_recursive,
//       is_tax_included,
//       recurring_days,
//       cost_price,
//       recurring_price,
//       unit_id,
//     });

//     if (!insert_record) {
//       return res.json({
//         error: true,
//         message: "Record submission failed",
//       });
//     }

//     return res.json({
//       error: false,
//       message: "Record successfully submitted",
//       data: insert_record[0],
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };

// const updateService = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       id: Joi.number().required(),
//       code: Joi.string().required().trim(),
//       name: Joi.string().required().trim(),
//       description: Joi.string().required().trim(),
//       price: Joi.number().required(),
//       status: Joi.string().valid("0", "1").default("1"),
//       is_recursive: Joi.string().valid("0", "1").default("1"),
//       is_tax_included: Joi.string().valid("0", "1").default("1"),
//       recurring_days: Joi.number().required(),
//       cost_price: Joi.number().required(),
//       recurring_price: Joi.number().required(),
//       unit_id: Joi.string().trim(),
//     });

//     const { error, value } = schema.validate(req.body);

//     if (error) {
//       return res.json({
//         error: true,
//         data: error.details[0].message,
//       });
//     }

//     const {
//       id,
//       code,
//       name,
//       description,
//       price,
//       status,
//       is_recursive,
//       is_tax_included,
//       recurring_days,
//       cost_price,
//       recurring_price,
//       unit_id,
//     } = value;

//     const updationDataIs = await functions.takeSnapShot("services", id);

//     const tableName = "services";
//     try {
//       await logs.logOldValues(tableName, id, value, req);
//     } catch {
//       console.log(error);
//     }

//     const update_record = await knex("services").where("id", id).update({
//       code,
//       name,
//       description,
//       price,
//       status,
//       is_recursive,
//       is_tax_included,
//       recurring_days,
//       cost_price,
//       recurring_price,
//       unit_id,
//     });

//     if (!update_record) {
//       return res.json({
//         error: true,
//         message: "Record updation failed",
//       });
//     }
//     if (id) {
//       const modifiedByTable1 = await functions.SetModifiedBy(
//         req.headers["authorization"],
//         "services",
//         "id",
//         id
//       );
//       console.log("isUpdated:-", modifiedByTable1);
//     }
//     return res.json({
//       error: false,
//       message: "Record updated successfully",
//       data: id,
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };

const viewService = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    const rows = await knex(tableName)
      .select(
        `${tableName}.*`,
        "units.name as unit",
        "material_group.name as material_group"
      )
      .leftJoin("units", `${tableName}.unit_id`, "units.id")
      .leftJoin(
        "material_group",
        `${tableName}.material_grp_id`,
        "material_group.id"
      )
      .where(`${tableName}.id`, id);

    if (rows.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Record found successfully",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error.message),
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const { error, value } = validation.del(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;
    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const delete_record = await knex("services")
      .where("id", id)
      .update("isDeleted", 1);
    if (!delete_record) {
      return res.status(500).json({
        error: true,
        message: "Deletion of record failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Record deleted successfully",
      data: id,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record",
      data: JSON.stringify(error.message),
    });
  }
};

const deleteAllService = async (req, res) => {
  try {
    const { error, value } = validation.deleteAll(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { ids } = value;

    const tableName = "services";

    const delete_all_status = await knex(tableName)
      .whereIn("id", ids)
      .update("isDeleted", 1);

    if (!delete_all_status) {
      return res.status(500).json({
        error: true,
        message: "Table is empty",
      });
    }

    return res.status(200).json({
      error: false,
      message: "All selected records deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "services";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.status(400).error) {
      return res.json({
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
      message: "Could not delete record(s)",
      data: JSON.stringify(error.message),
    });
  }
};

export default {
  createService,
  PaginationService,
  updateService,
  viewService,
  deleteService,
  deleteAllService,
  delteMultipleRecords,
};
