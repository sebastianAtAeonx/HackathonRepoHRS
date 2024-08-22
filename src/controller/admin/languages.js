import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import { v4 as uuidv4 } from "uuid";
import { json } from "express";
import { decode } from "jsonwebtoken";
import  logs  from "../../middleware/logs.js"
import validation from "../../validation/admin/languages.js"

const paginateLang = async (req, res) => {
  try {
    const tableName = "languages";
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
      message: "Languages are retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load records.",
      data: JSON.stringify(error),
    });
  }
};
const viewLang = async (req, res) => {
  try {
    const tableName = "languages";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({ id: id });
    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Language not found",
      });
    }

    console.log(result[0].country_name);

    const country = await knex("countries").where({
      name: result[0].country_name,
    });

    return res.status(200).json({
      error: false,
      message: "Language found Successfully",
      data: {
        result,
        country,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};
const createLang = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, code, country_name, status } = value;
    const id = uuidv4();
    console.log(country_name);

    const result_country = await knex("countries").where({
      name: country_name,
    });

    if (Array.isArray(result_country) && result_country.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Country Name does not exist",
      });
    }

    const result = await knex("languages").where({ name: name, isDeleted : '0' });

    if (Array.isArray(result) && result.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Language is already exist",
      });
    }

    const check_code = await knex("languages").where({ code: code });

    if (check_code.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Language already exist with this code",
      });
    }

    const timestampis = knex.fn.now();
    const insertId = await knex("languages").insert({
      id,
      name,
      code,
      country_name,
      status,
      created_at: timestampis,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create language.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Language added successfully",
      data: {
        insertId: id,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create language.",
      data: JSON.stringify(error),
    });
  }
};
const updateLang = async (req, res) => {
  try {
    const tableName = "languages";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, code, country_name, id, status } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const result_country = await knex("countries").where({
      name: country_name,
    });

    if (Array.isArray(result_country) && result_country.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Country Code does not Exist",
      });
    }

    const result = await knex(tableName)
      .where({ name: name })
      .where("id", "!=", id);

    if (Array.isArray(result) && result.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Country already exist",
      });
    }

    const check_code = await knex(tableName)
      .where({ code: code })
      .where("id", "!=", id);

    if (check_code.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Country already exist with this Code",
      });
    }

    const updationDataIs = await functions.takeSnapShot(tableName,id);

    const timestampis = knex.fn.now();
    const insertId = await knex(tableName)
      .update({ name, code, country_name, id, status, updated_at: timestampis })
      .where({ id: id });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update record.",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"languages","id",id);
    }
    return res.status(200).json({
      error: false,
      message: "Updated successfully.",
      data: {
        updatedId: id,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};
const deleteLang = async (req, res) => {
  try {
    const tableName = "languages";

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
        message: "Could not delete record.",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Deleted successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
    message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "languages";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
}
export default {
  paginateLang,
  viewLang,
  createLang,
  updateLang,
  deleteLang,
  delteMultipleRecords
};
