import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/item_category.js";

const createItemCategory = async (req, res) => {
  const tableName = "item_categories";

  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { parent_id, name, subscriber_id, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const resultx = await knex(tableName).where({
      name: name,
    });
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Record already exist with this name",
      });
    }

    const checkParentId = await knex("items").where({
      id: parent_id,
    });

    if (Array.isArray(checkParentId) && checkParentId.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Parent category does not exist",
      });
    }

    const timestampis = knex.fn.now();
    const created_at = timestampis;
    const insertId = await knex(tableName).insert({
      parent_id,
      name,
      subscriber_id,
      status,
      created_at,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Item category create failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Item category created",
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
const viewItemCategory = async (req, res) => {
  const tableName = "item_categories";
  try {

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;
    const result = await knex(tableName)
      .where({
        id,
      })
      .select();

    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    return res.status(200).json({
      error: false,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fatch record.",
      data: JSON.stringify(error),
    });
  }
};

const updateItemCategory = async (req, res) => {
  const tableName = "item_categories";

  try {
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, parent_id, name, subscriber_id, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const resultx = await knex(tableName)
      .where({
        name: name,
      })
      .where("id", "!=", id);
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(500).json({
        error: true,
        message: "Can not update the category name",
      });
    }

    const checkParentId = await knex("items").where({
      id: parent_id,
    });

    if (Array.isArray(checkParentId) && checkParentId.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Parent category does not exist",
      });
    }

    const updated_at = knex.fn.now();

    const insertId = await knex(tableName)
      .where({
        id: id,
      })
      .update({
        parent_id,
        subscriber_id,
        status,
        updated_at,
      });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Update failed",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "item_categories",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Item category updated successfully",
      data: {
        insertId,
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

const deleteItemCategory = async (req, res) => {
  const tableName = "item_categories";
  try {

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

    const result = await knex(tableName)
      .where({
        id,
      })
      .update("isDeleted", 1);
    if (result) {
      return res.status(200).json({
        error: false,
        message: "Record deleted successfully",
      });
    } else {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const PaginateItemCategory = async (req, res) => {
  try {
    const tableName = "item_categories";
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

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "item_categories";
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
  createItemCategory,
  viewItemCategory,
  updateItemCategory,
  deleteItemCategory,
  PaginateItemCategory,
  delteMultipleRecords,
};
