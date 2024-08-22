import { json } from "express";
import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/supplier/logistics.js";

const createLogistics = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { companyName, contactPerson, email, phone, location, status } =
      value;

    if (functions.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const checkCompanyName = await knex("logistics").where({ companyName });
    if (checkCompanyName.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Company name already exists",
      });
    }

    const checkEmail = await knex("logistics").where({ email });
    if (checkEmail.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Email already exists",
      });
    }

    const insertLogistics = await knex("logistics").insert({
      companyName,
      contactPerson,
      email,
      phone,
      location,
      status,
    });
    if (!insertLogistics) {
      return res.status(500).json({
        error: true,
        message: "Unable to create logistics",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Logistics created successfully",
      id: insertLogistics[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const viewLogistics = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    const getLogistics = await knex("logistics").where({ id });
    if (getLogistics.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Logistics not found",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Logistics found successfully",
      data: getLogistics,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteLogistics = async (req, res) => {
  try {
    const tableName = "logistics";
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

    const getLogistics = await knex("logistics").where({ id });
    if (getLogistics.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Logistics not found",
      });
    }
    const deleteLogistics = await knex("logistics").where({ id }).update('isDeleted', 1); 
    if (!deleteLogistics) {
      return res.status(500).json({
        error: true,
        message: "Unable to delete logistics",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Logistics deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const paginateLogistic = async (req, res) => {
  try {
    const tableName = "logistics";
    const searchFrom = ["companyName"];

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
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const updateLogistics = async (req, res) => {
  try {
    const tableName = "logistics";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { companyName, contactPerson, email, phone, location, status, id } =
      value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    if (functions.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const getLogistics = await knex("logistics")
      .where({
        companyName: companyName,
      })
      .where("id", "!=", id);
    if (getLogistics.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Company name already exists",
      });
    }

    const checkEmail = await knex("logistics")
      .where({ email: email })
      .where("id", "!=", id);
    if (checkEmail.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Email already exists",
      });
    }

    const updateLogistics = await knex("logistics")
      .where("id", "=", id)
      .update({
        companyName,
        contactPerson,
        email,
        phone,
        location,
        status,
      });

    if (!updateLogistics) {
      return res.status(500).json({
        error: true,
        message: "Unable to update logistics",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"logistics","id",id);
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Logistics updated successfully",
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
    const tableName = "logistics";
    const { ids } = req.body;
  
    const result = await functions.delteMultipleRecords(tableName, ids, req);
    console.log("this is result",result)
  
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
  createLogistics,
  viewLogistics,
  updateLogistics,
  deleteLogistics,
  paginateLogistic,
  deleteLogistics,
  delteMultipleRecords
};
