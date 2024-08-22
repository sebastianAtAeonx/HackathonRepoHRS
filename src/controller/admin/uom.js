import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import { json } from "express";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/uom.js";

const createUom = async (req, res) => {
  try {
    const tableName = "units";
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, unit, status } = value;

    const resultx = await knex(tableName)
      .where({ name: name })
      .andWhere({isDeleted:'0'});
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Unit name is alredy exist",
      });
    }

    const unit_is = await knex(tableName)
      .where({ unit: unit })
      .andWhere({isDeleted:'0'});
    if (Array.isArray(unit_is) && unit_is.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Unit is alredy exist",
      });
    }

    const timestampis = knex.fn.now();
    const created_at = timestampis;
    const insertId = await knex(tableName).insert({
      name,
      unit,
      status,
      created_at,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Unit could not be created",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Unit created successfully",
      data: insertId,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Unit.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const ViewUom = async (req, res) => {
  try {
    const tableName = "units";

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
      .where({ id })
      .andWhere({isDeleted:'0'})
      .select();

    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Unit does not exist",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Unit retrived successfully",
      data: result,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch Unit.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const UpdateUom = async (req, res) => {
  try {
    const tableName = "units";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, name, unit, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const resultx = await knex(tableName)
      .where({ name: name })
      .where("id", "!=", id)
      .whereNot("isDeleted",1);
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Unit name is alredy exist",
      });
    }

    const unit_is = await knex(tableName)
      .where({ unit: unit })
      .where("id", "!=", id)
      .whereNot("isDeleted",1);
    if (Array.isArray(unit_is) && unit_is.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Unit is alredy exist",
      });
    }

    const timestampis = knex.fn.now();
    const updated_at = timestampis;

    const updationDataIs = await functions.takeSnapShot(tableName, id);
    // const {id}=value;
    const insertId = await knex(tableName)
      .where({ id: id })
      .andWhere({isDeleted:'0'})
      .update({
        name,
        unit,
        status,
        updated_at,
      });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Unit could not be updated",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "units",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: " Unit Updated successfully.",
      data: {
        id: id,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Unit.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const DeleteUom = async (req, res) => {
  try {
    const tableName = "units";

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

    const result = await knex("units").where({ id }).update({ isDeleted: 1 });
    if (result) {
      return res.status(200).json({
        error: false,
        message: "Unit successfully deleted",
      });
    } else {
      return res.status(500).json({
        error: true,
        message: "Unit could not delete",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Unit.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const PaginateUoms = async (req, res) => {
  try {
    const tableName = "units";
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
    let results = knex(tableName).andWhere({isDeleted:'0'});
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
    let rows = knex(tableName).andWhere({isDeleted:'0'});

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
      message: "Units retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch Unit.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "units";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Units",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Units successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Unit.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "units";

    if (!req.files.excelfile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headerMappings = {
      name: "name",
      unit: "unit",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("unit", "name")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.name}-${row.unit}`), new Set())
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.name}-${rowData.unit}`;
      return !existingEntries.has(entryKey);
    });

    if (dataToInsert.length === 0) {
      return res.json({
        error: true,
        message: "All data from the Excel file already exists.",
      });
    }

    const validData = [];
    const errors = [];

    // Validate each row
    for (const row of dataToInsert) {
      const { error } = validation.importExcel(row);
      if (error) {
        errors.push({
          rowNumber: row.rowNumber,
          message: `Validation error in row ${row.rowNumber}: ${error.details[0].message}`,
        });
      } else {
        validData.push(row);
      }
    }

    if (validData.length > 0) {
      // Remove rowNumber before inserting
      const Data = validData.map(({ rowNumber, ...rest }) => rest);
      await knex.transaction(async (trx) => {
        await trx(tableName).insert(Data);
      });
    }

    const responseMessage =
      validData.length === dataToInsert.length
        ? "Data inserted successfully"
        : "Some records were not inserted due to validation errors.";
    return res.json({
      error: validData.length === 0,
      message: responseMessage,
      errors: errors.length > 0 ? errors : [],
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
      data: [],
    });
  }
};
export default {
  createUom,
  ViewUom,
  UpdateUom,
  PaginateUoms,
  DeleteUom,
  delteMultipleRecords,
  importExcel,
};
