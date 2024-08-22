import knex from "../../config/mysql_db.js";
import logs from "../../middleware/logs.js";
import fun from "../../helpers/functions.js";
import validation from "../../validation/supplier/bids.js";

const createBid = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { auction_id, supplier_id, bid_amount, bid_date, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const dateString = bid_date;
    const parts = dateString.split("-");
    const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
    const b_date = dateObject;

    const check_auction_id = await knex("auctions").where({
      id: auction_id,
    });

    if (Array.isArray(check_auction_id) && check_auction_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "auction does not exist",
      });
    }

    // const check_suppplier_id = await knex("supplier_details").where({
    //     id: supplier_id
    // });

    // if (Array.isArray(check_suppplier_id) && check_suppplier_id.length <= 0) {
    //     res.json({
    //         error: true,
    //         message: "supplier does not exist",
    //     });
    //     return res.end();
    // }

    const created_at = knex.fn.now();
    const insertInBid = await knex("bids").insert({
      auction_id,
      supplier_id,
      bid_amount,
      bid_date: b_date,
      status,
      created_at,
    });
    if (!insertInBid) {
      return res.status(500).json({
        error: true,
        message: "Unable to add data",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Bid created successfully",
      insertInBid: insertInBid[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const viewBid = async (req, res) => {
  try {
    const tableName = "bids";

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
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

const updateBid = async (req, res) => {
  try {
    const tableName = "bids";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, auction_id, supplier_id, bid_amount, bid_date } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const dateString = bid_date;
    const parts = dateString.split("-");
    const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
    const b_date = dateObject;

    const check_auction_id = await knex("auctions").where({
      id: auction_id,
    });

    if (Array.isArray(check_auction_id) && check_auction_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "auction does not exist",
      });
    }

    // const check_suppplier_id = await knex("supplier_details").where({
    //     id: supplier_id
    // });

    // if (Array.isArray(check_suppplier_id) && check_suppplier_id.length <= 0) {
    //     res.json({
    //         error: true,
    //         message: "supplier does not exist",
    //     });
    //     return res.end();
    // }

    const updated_at = knex.fn.now();
    const updateInBid = await knex("bids").where("id", id).update({
      bid_amount,
      bid_date: b_date,
      updated_at,
    });
    if (!updateInBid) {
      return res.status(500).json({
        error: true,
        message: "Unable to update date",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "bids",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Bid updated successfully",
      updateBid: updateBid[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteBid = async (req, res) => {
  try {
    const tableName = "bids";

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
      .del();
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

const paginateBids = async (req, res) => {
  try {
    const tableName = "bids";
    const searchFrom = ["bid_amount"];

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

const supplierRank = async (req, res) => {
  try {
    const tableName = "bids";
    const searchFrom = ["bid_amount"];

    const { error, value } = validation.supplierRank(req.body);
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

    //give rank and get name
    for (const iterator of rows) {
      const get_name_sp_id = await knex("supplier_details").where(
        "id",
        iterator.supplier_id
      );
      if (get_name_sp_id.length > 0) {
        iterator.supplier_name = get_name_sp_id[0].supplier_name;
      }
    }

    let data_rows = [];
    if (order === "asc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.rank = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.rank = sr;
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
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const rank = async (req, res) => {
  try {

    const { error, value } = validation.Rank(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { offset, limit, status } = value;

    let query = knex
      .select("auction_id", "id", "bid_amount", "status")
      .select(
        knex.raw(
          "RANK() OVER (PARTITION BY auction_id ORDER BY bid_amount ASC) AS bid_rank"
        )
      )
      .from("bids");

    // if (status != "" || status != "0") {
    //     query = query.where("status", "1")
    // }

    if (status != undefined && status != "") {
      query.where("status", status);
    }

    query = await query.limit(limit).offset(offset);

    // rows = await rows.orderBy(sort, order);

    if (!query) {
      return res.json({
        error: true,
        message: "data not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "data found successfully",
      data: query,
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
    const tableName = "bids";
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
  createBid,
  viewBid,
  updateBid,
  deleteBid,
  paginateBids,
  supplierRank,
  rank,
  delteMultipleRecords,
};
