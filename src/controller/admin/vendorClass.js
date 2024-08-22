import Joi from "joi";
import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/vendorClass.js";

const vendorClassList = async (req, res) => {
  try {
    const tableName = "vendor_class";
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
    let results = knex(tableName).where({isDeleted:'0'});
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
    let rows = knex(tableName).where({isDeleted:'0'});

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
      message: "Could not load Vendor Class.",
      data: JSON.stringify(error),
    });
  }
};
const vendorClassCreate = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { code, name, status } = value;

    const check_code = await knex("vendor_class")
      .where({ code: code })
      .andWhere({isDeleted:'0'})
      .first();

    if (check_code) {
      return res.status(409).json({
        error: true,
        message: "Vendor Class code already exist",
      });
    }

    const insertRecord = await knex("vendor_class").insert({
      code,
      name,
      status,
    });

    if (insertRecord[0] <= 0) {
      return res.status(500).json({
        error: true,
        message: "Vendor Class not created",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Vendor Class created successfully",
      data: insertRecord[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Vendor Class.",
      data: JSON.stringify(error),
    });
  }
};
const vendorClassDelete = async (req, res) => {
  try {
    const tableName = "vendor_class";

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

    const check = await knex("vendor_class")
      .where({
        id: id,
      })
      .update("isDeleted", 1);
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Vendor Class could not delete",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Vendor Class deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Vendor Class.",
      data: JSON.stringify(error),
    });
  }
};
const vendorClassView = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id } = value;
    const check = await knex("vendor_class")
      .where({
        id: id,
      })
      .andWhereNot({ isDeleted: 1 })
      .first();
    if (!check) {
      return res.status(404).json({
        error: true,
        message: "Vendor Class not found.",
      });
    }
    delete check.password;
    return res.status(404).json({
      error: false,
      message: "Vendor Class found.",
      data: check,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Vendor Class.",
      data: JSON.stringify(error),
    });
  }
};
const vendorClassUpdate = async (req, res) => {
  try {
    const tableName = "vendor_class";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id, name, status } = value;

    const updationDataIs = await functions.takeSnapShot("vendor_class", id);

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const updateRecord = await knex("vendor_class")
      .where({
        id: id,
      })
      .update({ name: name, status: status });
    if (updateRecord <= 0) {
      return res.status(500).json({
        error: true,
        message: "Vendor Class not updated",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "vendor_class",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Vendor Class updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update Vendor Class.",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "vendor_class";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Vendor Class",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Vendor Class successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Vendor Class.",
      data: JSON.stringify(error),
    });
  }
};

// Excel import
const importExcel = async (req, res) => {
  try {
    const tableName = "vendor_class";

    if (!req.files.excelfile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headerMappings = {
      code: "code",
      name: "name",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("code", "name")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.code}-${row.name}`), new Set())
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.code}-${rowData.name}`;
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
      console.log(Data);
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
  vendorClassList,
  vendorClassCreate,
  vendorClassDelete,
  vendorClassView,
  vendorClassUpdate,
  delteMultipleRecords,
  importExcel,
};
