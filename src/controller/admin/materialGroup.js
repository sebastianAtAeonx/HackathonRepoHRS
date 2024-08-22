import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/materialGroup.js";

const createMaterial_group = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { code, name, description, subscriber_id } = value;

    const data = {
      code,
      name,
      description,
      subscriber_id,
    };

    // const check_subscriber_id = await knex("subscribers").where({
    //     id: subscriber_id,
    //   });

    //   if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
    //    return res.json({
    //       error: true,
    //       message: "subscriber does not exist",
    //     });
    //
    //   }
    // const created_at = knex.fn.now();
    // const updated_at = knex.fn.now();

    const check_data = knex("material_group")
      .where({
        name: name,
      })
      .orWhere({ code: code });
    console.log(check_data.toQuery());

    if (check_data.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Record already exist",
      });
    }

    const insert_material_group = await knex("material_group").insert({
      subscriber_id,
      code,
      name,
      description,
    });
    if (!insert_material_group) {
      return res.status(500).json({
        error: true,
        message: "Could not create record",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Record created successfully",
      data: insert_material_group[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record",
    });
  }
};

const updateMaterial_group = async (req, res) => {
  try {
    const tableName = "material_group";
    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }
    //   const check_subscriber_id = await knex("subscribers").where({
    //     id: subscriber_id,
    //   });

    //   if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
    //    return res.json({
    //       error: true,
    //       message: "subscriber does not exist",
    //     });
    //
    //   }

    const { id, code, name, subscriber_id, description, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const data = {
      code,
      name,
      subscriber_id,
      description,
      status,
    };
    const check_id = await knex("material_group").where({
      id: id,
    });

    if (Array.isArray(check_id) && check_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Record does not exist",
      });
    }

    // const checkMaterial_data = await knex("material_group")
    //   .select("*")
    //   .where({ code: code })
    //   .orWhere({ name: name });

    // if (checkMaterial_data.length > 0) {
    //   return res.json({
    //     error: true,
    //     message: " Material_group already exists.",
    //   });
    // }

    const updationDataIs = await functions.takeSnapShot("material_group", id);

    const updateTypeOfMaterial = await knex("material_group")
      .where({ id })
      .update(data);
    if (!updateTypeOfMaterial) {
      return res.status(500).json({
        error: false,
        message: "Could not update record.",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "material_group",
        "id",
        id
      );
    }
    return res.status(200).json({
      error: false,
      message: "Record updated.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
    });
  }
};

const viewMaterialGroup = async (req, res) => {
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

    const result = await knex("material_group").select().where({ id });
    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Data not found",
        data: error,
      });
    }
    //   delete result[0].updated_at;
    //   delete result[0].created_at;

    return res.status(200).json({
      error: false,
      message: "View successful",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch data",
    });
  }
};

const deleteMaterialGroup = async (req, res) => {
  try {
    const tableName = "material_group";

    const { error, value } = validation.del(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const delete_pg = await knex("material_group").where({ id }).delete();
    if (delete_pg) {
      return res.status(200).json({
        message: "Record deleted successfully",
      });
    } else {
      return res.status(404).json({
        message: "Record not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record",
    });
  }
};

const paginateMaterialGroup = async (req, res) => {
  try {
    const tableName = "material_group";
    const searchFrom = ["code", "name", "units"];

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
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
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
      message: "Data retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load records",
    });
  }
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "material_group";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
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
};

export default {
  createMaterial_group,
  updateMaterial_group,
  viewMaterialGroup,
  deleteMaterialGroup,
  paginateMaterialGroup,
  delteMultipleRecords,
};
