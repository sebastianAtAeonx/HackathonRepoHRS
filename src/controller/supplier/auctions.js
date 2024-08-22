import knex from "../../config/mysql_db.js";
import logs from "../../middleware/logs.js";
import fun from "../../helpers/functions.js";
import validation from "../../validation/supplier/auctions.js";

const createAuction = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      subscriber_id,
      plant_id,
      title,
      description,
      start_date,
      end_date,
      min_bid,
      status,
    } = value;

    const dateString = start_date;
    const parts = dateString.split("-");
    const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
    const s_date = dateObject;

    const dateString2 = end_date;
    const parts2 = dateString2.split("-");
    const dateObject2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);
    const e_date = dateObject2;
    const created_at = knex.fn.now();

    const check_subscriber_id = await knex("subscribers").where({
      id: subscriber_id,
    });

    if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
      return res.json({
        error: true,
        message: "subscriber does not exist",
      });
    }

    const insertInAuction = await knex("auctions").insert({
      subscriber_id,
      plant_id,
      description,
      start_date: s_date,
      end_date: e_date,
      title,
      min_bid,
      status,
      created_at,
    });
    if (!insertInAuction) {
      return res.status(500).json({
        error: true,
        message: "Unable to insert data",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Auction created successfully",
      insertInAuction: insertInAuction[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const viewAuction = async (req, res) => {
  try {
    const tableName = "auctions";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(500).json({
        error: true,
        message: error.details[0].message,
        data: JSON.stringify(error),
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

const updateAuction = async (req, res) => {
  try {
    const tableName = "auctions";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      id,
      subscriber_id,
      plant_id,
      title,
      description,
      start_date,
      end_date,
      min_bid,
      status,
    } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const dateString = start_date;
    const parts = dateString.split("-");
    const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
    const s_date = dateObject;

    const dateString2 = end_date;
    const parts2 = dateString2.split("-");
    const dateObject2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);
    const e_date = dateObject2;
    const created_at = knex.fn.now();

    const check_subscriber_id = await knex("subscribers").where({
      id: subscriber_id,
    });

    if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "subscriber does not exist",
      });
    }

    const check_id = await knex("auctions").where({
      id: id,
    });
    if (Array.isArray(check_id) && check_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Auction does not exist",
      });
    }

    const updated_at = knex.fn.now();

    const updateInAuction = await knex("auctions").where("id", id).update({
      subscriber_id,
      plant_id,
      start_date: s_date,
      end_date: e_date,
      description,
      min_bid,
      title,
      status,
      updated_at,
    });
    if (!updateAuction) {
      return res.status(500).json({
        error: true,
        message: "unable to update auction",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "auctions",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Auction updated successfully",
      updateAuction: updateAuction[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteAuction = async (req, res) => {
  try {
    const tableName = "auctions";

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
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

const paginateAuction = async (req, res) => {
  try {
    const tableName = "auctions";
    const searchFrom = ["title"];

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
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "auctions";
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
  createAuction,
  viewAuction,
  updateAuction,
  deleteAuction,
  paginateAuction,
  delteMultipleRecords,
};
