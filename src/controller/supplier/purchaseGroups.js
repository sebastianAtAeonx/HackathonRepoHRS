import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/purchaseGroups.js";

const createPurchaseGroup = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { code, name } = value;
    const data = {
      code,
      name,
    };

    const checkPg = await knex("purchase_groups").where(data).select("*");
    if (checkPg.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Purchase group already exists.",
      });
    }
    const insertPgId = await knex("purchase_groups").insert(data);
    if (!insertPgId) {
      return res.status(500).json({
        error: true,
        message: "Unable to add in database",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Purchase group created.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const updatePurchaseGroup = async (req, res) => {
  try {
    const tableName = "purchase_groups";
    const { error, value } = validation.update(req.body);

    if (error) {
      return resres.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, code, name, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const data = {
      code,
      name,
      status,
    };

    const checkPg = await knex("purchase_groups").select("*").where(data);

    if (checkPg.length > 0) {
      return resres.status(409).json({
        error: true,
        message: "Purchase group already exists.",
      });
    }

    const updationDataIs = await functions.takeSnapShot("purchase_groups", id);

    const update_pg = await knex("purchase_groups").where({ id }).update(data);
    if (!update_pg) {
      return res.status(500).json({
        error: false,
        message: "Update in database failed",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "purchase_groups",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Purchase group updated.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deletePurchaseGroup = async (req, res) => {
  try {
    const tableName = "purchase_groups";

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

    const delete_pg = await knex("purchase_groups").where({ id }).delete();
    if (delete_pg) {
      return res.status(200).json({
        message: "Record deleted successfully",
      });
    } else {
      return res
        .status(404)
        .json({
          message: "Record not found",
        })
        .status(404);
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const viewPurchaseGroup = async (req, res) => {
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

    const result = await knex("purchase_groups").select().where({ id });
    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Purchase group not found",
        data: error,
      });
    }
    delete result[0].updated_at;
    delete result[0].created_at;

    return res.status(200).json({
      error: false,
      message: "View successful",
      data: result,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const paginatePurchaseGroup = async (req, res) => {
  try {
    const tableName = "purchase_groups";
    const searchFrom = ["code", "name"];
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
      message: "retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "purchase_groups";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);
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
  createPurchaseGroup,
  updatePurchaseGroup,
  deletePurchaseGroup,
  viewPurchaseGroup,
  paginatePurchaseGroup,
  delteMultipleRecords,
};
