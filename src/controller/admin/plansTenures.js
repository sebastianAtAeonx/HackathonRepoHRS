import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import { v4 as uuidv4 } from "uuid";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/plansTenures.js";

const createPlanTenures = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        error: error,
      });
    }

    const { plan_id, tenure, months, price, discounted_price, status } = value;

    // check plan id is exists or not
    const planId = await fun.checkCodeExists("plans", "id", plan_id);
    if (planId["error"] == true) {
      return res.status(409).json({
        error: true,
        message: "Plan does not exist",
      });
    }

    const id = uuidv4();
    const timestamps = knex.fn.now();

    const insertId = await knex("plans_tenures").insert({
      id,
      plan_id,
      tenure,
      months,
      price,
      discounted_price,
      status,
      created_at: timestamps,
      updated_at: timestamps,
    });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Plans Tenures Added Successfully.",
      data: { insertId: id },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginatePlanTenures = async (req, res) => {
  try {
    const tableName = "plans_tenures";
    const searchFrom = ["months", "tenure"];

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
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewPlanTenures = async (req, res) => {
  try {
    const tableName = "plans_tenures";
    const id = req.params.id;

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const result = await knex(tableName).where({ id: id });

    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Record Not Found.",
      });
    }

    const plan = await knex("plans")
      .select("id", "title")
      .where({ id: result[0].plan_id });

    result[0].plans = plan;

    return res.status(200).json({
      error: false,
      message: "Data Retrived Successfully.",
      data: { result },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const deletePlanTenures = async (req, res) => {
  try {
    const tableName = "plans_tenures";

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

    // check plans tenures id is exists or not
    const plantId = await fun.checkCodeExists(tableName, "id", id);
    if (plantId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Plans Tenures does not exist",
      });
    }

    const check = await knex(tableName).where({ id }).del();

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
    return res.json({
      error: true,
      message: "Could not delete record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updatePlanTenures = async (req, res) => {
  try {
    const tableName = "plans_tenures";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id, plan_id, tenure, months, price, discounted_price, status } =
      value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    // check plans tenures id is exists or not
    const plantId = await fun.checkCodeExists(tableName, "id", id);
    if (plantId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Plans Tenures does not exist",
      });
    }

    // check plans tenures id is exists or not
    const planId = await fun.checkCodeExists("plans", "id", plan_id);
    if (planId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Plans does not exist",
      });
    }

    const timestamps = knex.fn.now();

    const updationDataIs = await functions.takeSnapShot(tableName, id);

    const updateId = await knex(tableName)
      .update({
        plan_id,
        tenure,
        months,
        price,
        discounted_price,
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
        "plans_tenures",
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
    const tableName = "plans_tenures";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

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
  createPlanTenures,
  paginatePlanTenures,
  viewPlanTenures,
  deletePlanTenures,
  updatePlanTenures,
  delteMultipleRecords,
};
