import knex from "../../config/mysql_db.js";
import logs from "../../middleware/logs.js";
import fun from "../../helpers/functions.js";
import validation from "../../validation/supplier/materialCategory.js";

const paginateMaterialType = async (req, res) => {
  try {
    const tableName = "material_type";
    const searchFrom = ["name", "description"];

    const { error, value } = validation.paginateMaterilType(req.body);
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
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
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
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const createMaterialCategory = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { name, status } = value;

    const check_material_category_name = await knex("material_categories")
      .where({
        name: name,
      })
      .first();

    if (check_material_category_name != undefined) {
      return res.status(409).json({
        error: true,
        message: "Material Category Already Exist",
      });
    }

    const insertData = await knex("material_categories").insert({
      name,
      status,
    });
    if (!insertData) {
      return res.status(500).json({
        error: true,
        message: "Creating Material Category Failed",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Material Category Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};
const updateMaterialCategory = async (req, res) => {
  try {
    const tableName = "material_categories";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, name, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check_material_category_name = await knex("material_categories")
      .where({
        name: name,
      })
      .where("id", "<>", id)
      .first();

    if (check_material_category_name != undefined) {
      return res.status(409).json({
        error: true,
        message: "Material Category Already Exist",
      });
    }

    const updateData = await knex("material_categories")
      .where({ id: id })
      .update({
        name,
        status,
      });

    if (!updateData) {
      return res.status(500).json({
        error: true,
        message: "Updating Material Category Failed",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "material_categories",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Material Category Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};
const deleteMaterialCategory = async (req, res) => {
  try {
    const tableName = "material_categories";

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

    const deleteData = await knex("material_categories")
      .where({ id })
      .update("isDeleted", 1);

    if (!deleteData) {
      return res.status(500).json({
        error: true,
        message: "Deleting Material Category Failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Material Category Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};
const viewMaterialCategory = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    const result = await knex("material_categories").select().where({ id });

    if (!result) {
      return res.status(404).json({
        error: true,
        message: "Material Category not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Material fetched successful",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};
const paginateMaterialCategory = async (req, res) => {
  try {
    const tableName = "material_categories";
    const searchFrom = ["name"];

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
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
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
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "material_categories";
    const { ids } = req.body;

    const result = await fun.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

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
  createMaterialCategory,
  updateMaterialCategory,
  deleteMaterialCategory,
  viewMaterialCategory,
  paginateMaterialCategory,
  delteMultipleRecords,
};
