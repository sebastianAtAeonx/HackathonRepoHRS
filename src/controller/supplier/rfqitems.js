import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import { v4 as uuidv4 } from "uuid";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/rfqitems.js";

const paginateDepartment = async (req, res) => {
  try {
    const tableName = "departments";

    const searchFrom = ["companies.name"];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.json({
        error: true,

        message: error.details[0].message,

        data: JSON.stringify(error),
      });
    }

    let { offset, limit, order, sort, search, status } = value;

    let total = 0;

    let results = knex("departments")
      .join("companies", "departments.company_id", "companies.id")
      .select("departments.*", "companies.name as company_name");
    if (status != undefined && status != "") {
      total = results.where("departments.status", status);
    }

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    total = await results.count("departments.id as total").first();

    let rows = knex("departments")
      .join("companies", "departments.company_id", "companies.id")
      .select("departments.*", "companies.name as company_name");

    if (status != undefined && status != "") {
      rows.where("departments.status", status);
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
    fun.sendErrorLog(req, error);

    return res.json({
      error: true,

      message: "Something went wrong.",

      data: { error: JSON.stringify(error) },
    });
  }
};

//==================================================================

const createRfqItems = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { rfq_id, item_id, qty, status } = value;

    const check_rfq_id = await knex("request_for_quotations").where(
      "id",
      rfq_id
    );

    if (check_rfq_id.length == 0) {
      return res.json({
        error: true,
        message: "RFQ does not exist",
      });
    }

    const check_item_id = await knex("items").where("id", item_id);

    if (check_item_id.length == 0) {
      return res.json({
        error: true,
        message: "ITEM does not exist",
      });
    }

    const insert_rec = await knex("rfq_items").insert({
      rfq_id: rfq_id,
      item_id: item_id,
      qty: qty,
      status: status,
    });

    if (!insert_rec) {
      return res.json({
        error: true,
        message: "Record could not submitted",
      });
    }

    return res.json({
      error: false,
      message: "Record submitted successfully",
      inserted_id: insert_rec[0],
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const deleteRfqItems = async (req, res) => {
  try {
    const tableName = "rfq_items";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.json({
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

    const delete_record = await knex("rfq_items")
      .where("id", id)
      .update("isDeleted", 1);

    if (!delete_record) {
      return res.json({
        error: true,
        message: "Record could not delete",
      });
    }

    return res.json({
      error: false,
      message: "Record deleted successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updateRfqItems = async (req, res) => {
  try {
    const tableName = "rfq_items";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, rfq_id, item_id, qty, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check_rfq_id = await knex("request_for_quotations").where(
      "id",
      rfq_id
    );

    if (check_rfq_id.length == 0) {
      return res.json({
        error: true,
        message: "RFQ  does not exist",
      });
    }

    const check_item_id = await knex("items").where("id", item_id);

    if (check_item_id.length == 0) {
      return res.json({
        error: true,
        message: "ITEM does not exist",
      });
    }

    const updationDataIs = await functions.takeSnapShot("rfq_items", id);

    const update_rfq_item = await knex("rfq_items")
      .where("id", id)
      .update({ rfq_id: rfq_id, item_id: item_id, qty: qty, status: status });

    if (!update_rfq_item) {
      return res.json({
        error: true,
        message: "Record could not update",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "rfq_items",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.json({
      error: true,
      message: "Record updated successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};
const viewRfqItems = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    const result = await knex("rfq_items").where("id", id);

    if (result.length == 0) {
      return res.json({
        error: true,
        message: "Record does not exist",
      });
    }

    return res.json({
      error: true,
      message: "Record retrived successfully",
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
const paginateRfqItems = async (req, res) => {
  try {
    const tableName = "rfq_items";

    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.json({
        error: true,

        message: error.details[0].message,

        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;

    let results = knex(tableName)
      .join("items", "items.id", "rfq_items.item_id")
      .select("rfq_items.*", "items.name");

    let total = 0;

    if (status != undefined && status != "") {
      total = results.where("rfq_items.status", status);
    }

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    total = await results.count("items.id as total").first();

    let rows = knex(tableName)
      .join("items", "items.id", "rfq_items.item_id")
      .select("rfq_items.*", "items.name");

    if (status != undefined && status != "") {
      rows.where("rfq_items.status", status);
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
    fun.sendErrorLog(req, error);

    return res.json({
      error: true,

      message: "Something went wrong.",

      data: { error: JSON.stringify(error) },
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "rfq_items";
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
  createRfqItems,
  deleteRfqItems,
  updateRfqItems,
  viewRfqItems,
  paginateRfqItems,
  delteMultipleRecords,
};
