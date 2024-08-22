import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import { v4 as uuidv4 } from "uuid";
import  logs  from "../../middleware/logs.js"
import validation  from "../../validation/admin/plans.js"

const deletePlans = async (req, res) => {
  try {
    const tableName = "plans";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const check = await knex(tableName).where({ id: id }).update('isDeleted', 1);
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

const paginatePlans = async (req, res) => {
  try {
    const tableName = "plans";
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

const viewPlans = async (req, res) => {
  try {
    const tableName = "plans";
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({ id });
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

const createPlans = async (req, res) => {
  try {

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { title, description, status } = value;
    const id = uuidv4();

    const result = await knex("plans").where({ title: title });
    if (Array.isArray(result) && result.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Title is alredy exist",
      });
    }

    const timestampis = knex.fn.now();

    const insertId = await knex("plans").insert({
      id: id,
      title: title,
      description: description,
      status: status,
      created_at: timestampis,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Added successfully.",
      data: {
        insertId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const updatePlans = async (req, res) => {
  try {
    const tableName = "plans";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, title, description, status } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const result = await knex(tableName)
      .where({ title: title })
      .where("id", "!=", id);
    if (Array.isArray(result) && result.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Title is alredy there",
      });
    }

    const timestampis = knex.fn.now();

    const updationDataIs = await functions.takeSnapShot(tableName,id);

    const insertId = await knex(tableName)
      .update({ id, title, description, updated_at: timestampis, status })
      .where({ id: id });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Update in the database Failed",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"plans","id",id);
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Updated successfully.",
      data: {
        updatedId: id,
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
const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "plans";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
}

export default {
  paginatePlans,
  viewPlans,
  createPlans,
  updatePlans,
  deletePlans,
  delteMultipleRecords
};
