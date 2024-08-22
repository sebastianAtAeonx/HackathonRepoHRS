import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/items.js";

const createItem = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { code, name, category_id, description, unit_id, price, status } =
      value;

    const checkCategoryId = await knex("item_categories").where({
      id: category_id,
    });

    if (Array.isArray(checkCategoryId) && checkCategoryId.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Category does not exist",
      });
    }

    const checkUnitId = await knex("units").where({
      id: unit_id,
    });

    if (Array.isArray(checkUnitId) && checkUnitId.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Unit does not exist",
      });
    }

    const created_at = knex.fn.now();

    const resultx = await knex("items").where({
      code: code,
    });
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Item's code alredy there",
      });
    }

    const insertId = await knex("items").insert({
      code,
      name,
      category_id,
      unit_id,
      description,
      price,
      status,
      created_at,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Added successfully.",
      insertId: insertId[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const tableName = "items";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, name, category_id, description, unit_id, price, status } =
      value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const checkCategoryId = await knex("item_categories").where({
      id: category_id,
    });

    if (Array.isArray(checkCategoryId) && checkCategoryId.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Category does not exist",
      });
    }

    const checkUnitId = await knex("units").where({
      id: unit_id,
    });

    if (Array.isArray(checkUnitId) && checkUnitId.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Unit does not exist",
      });
    }

    const updated_at = knex.fn.now();

    const insertId = await knex("items")
      .update({
        name,
        category_id,
        unit_id,
        description,
        price,
        status,
        updated_at,
      })
      .where({
        id: id,
      });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Update in the database Failed",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "items",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }

    return res.status(200).json({
      error: false,
      message: "Updated successfully.",
      data: {
        insertId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const tableName = "items";

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
      .update("isDeleted", 1);
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

const PaginationItems = async (req, res) => {
  try {
    const tableName = "items";

    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;

    let results = knex(tableName);

    let total = 0;

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
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

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
      data: JSON.stringify(error),
    });
  }
};

const viewItem = async (req, res) => {
  try {
    const tableName = "items";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
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
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Record found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "items";
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
  createItem,
  updateItem,
  deleteItem,
  PaginationItems,
  viewItem,
  delteMultipleRecords,
};
