import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/business_partner_group.js";

import { v4 as uuidv4 } from "uuid";

const createBps = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { code, name, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    // check business partner group code is unique or not
    const bpsCode = await knex("business_partner_groups")
      .where({ code: code })
      .whereNot({ isDeleted: 1 });

    console.log("bpsCode:-", bpsCode);

    if (bpsCode) {
      return res.json({
        error: true,
        message: "business partner group Code is already Exists",
      });
    }

    const id = uuidv4();
    const timestamps = knex.fn.now();

    const insertId = await knex("business_partner_groups").insert({
      id,
      code,
      name,
      status,
      created_at: timestamps,
      updated_at: timestamps,
    });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database Failed.",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Data Created Successfully",
      data: { insertId: id },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const paginateBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";
    const searchFrom = ["code", "name"];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, sort, order, search } = value;

    let results = knex(tableName);

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    const total = await results.count("id as total").first();

    let rows = knex(tableName);

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
      message: "Data Retrived Successfully",
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

const viewBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";
    const id = req.params.id;

    const result = await knex(tableName).where({ id: id });

    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Record Not Found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Data Retrived Successfully.",
      data: { result },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";

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

    // check bpg id is exists or not
    const bpgId = await fun.checkCodeExists(tableName, "id", id);
    if (bpgId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Group does not exist",
      });
    }

    const check = await knex(tableName).where({ id }).del();

    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete Failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const updateBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, name, code, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    // check bpg id is exists or not
    const bpgId = await fun.checkCodeExists(tableName, "id", id);
    if (bpgId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Group does not exist",
      });
    }

    const timestamps = knex.fn.now();

    const resultx = await knex(tableName)
      .where({ code: code })
      .where("id", "!=", id);
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Code is alredy there exist",
      });
    }

    const updateId = await knex(tableName)
      .update({
        name,
        code,
        status,
        updated_at: timestamps,
      })
      .where({ id: id });

    if (!updateId) {
      return res.status(500).json({
        error: true,
        message: "Update in the database Failed.",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "business_partner_groups",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Update Successfully.",
      data: { updatedId: id },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "business_partner_groups";
    const { ids } = req.body;

    const result = await fun.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

    if (result.error) {
      return res.status(500).json({
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
  createBps,
  paginateBps,
  viewBps,
  deleteBps,
  updateBps,
  delteMultipleRecords,
};
