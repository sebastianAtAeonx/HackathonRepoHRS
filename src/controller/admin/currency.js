import knex from "../../../src/config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/currency.js";

const createCurrency = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, code, symbol, country_key, position, status } = value;

    const checkCurrencyDetail = await knex("currencies")
      .where("country_key", country_key)
      .whereNot("isDeleted",1)
      .first();
    
    if(checkCurrencyDetail){
      return res.json({
        error: true,
        message: "Country with this currency already exists.",
      })
    }

    const checkCurrencyDetail2 = await knex("currencies")
      .where("code", code)
      .whereNot("isDeleted",1)
      .first();
    
    if(checkCurrencyDetail2){
      return res.json({
        error: true,
        message: "Currency code is already exists.",
      })
    }

    const created_at = knex.fn.now();

    // const find_country_key = await knex("currencies").where(
    //   "country_key",
    //   country_key
    // );
    // if (find_country_key != 0) {
    //   return res.json({
    //     error: true,
    //     message: "Country Key is already exist",
    //   });
    // }

    const insertId = await knex("currencies").insert({
      name,
      country_key,
      code,
      symbol,
      position,
      status,
      created_at,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Currency.",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Currency added successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Currency.",
      data: JSON.stringify(error),
    });
  }
};

const paginateCurrency = async (req, res) => {
  try {
    const tableName = "currencies";
    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let total = 0;
    let results = knex(tableName).whereNot({isDeleted:1});
    if (status != undefined && status != "") {
      total = results.where("currencies.status", status);
    }
    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    total = await results.count("id as total").first();

    let rows = knex(tableName).whereNot({isDeleted:1});
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
      message: "Currency retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load Currency.",
      data: JSON.stringify(error),
    });
  }
};

const updateCurrency = async (req, res) => {
  try {
    const tableName = "currencies";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, id, code, country_key, symbol, position, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const updated_at = knex.fn.now();
    const resultx = await knex(tableName)
      .where({ country_key: country_key })
      .where("id", "!=", id)
      .whereNot("isDeleted",1);

    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Currency Country is alredy exist",
      });
    }

    const updationDataIs = await functions.takeSnapShot(tableName, id);

    const insertId = await knex(tableName)
      .update({ name, country_key, code, symbol, position, status, updated_at })
      .where({ id })
      .whereNot({isDeleted:1});
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Currency.",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "currencies",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Currency is updated successfully.",
      data: insertId,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Currency.",
      data: { error: JSON.stringify(error) },
    });
  }
};
const deleteCurrency = async (req, res) => {
  try {
    const tableName = "currencies";

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

    const check = await knex(tableName).where({ id }).update({isDeleted:1});
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Currency",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Currency is deleted Successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete Currency.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "currencies";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more Currency",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.json({
      error: false,
      message: "Deleted all selected Currency successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not delete Currency",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "currencies";

    if (!req.files || !req.files.excelfile) {
      return res.status(400).json({
        error: true,
        message: "No file uploaded",
        data: [],
      });
    }

    const headerMappings = {
      name: "name",
      code: "code",
      symbol: "symbol",
      position: "position",
      // "country": "name",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("code")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.code}`), new Set())
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.code}`;
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
      console.log(row);

      // Validate the row using the schema
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
  createCurrency,
  paginateCurrency,
  updateCurrency,
  deleteCurrency,
  delteMultipleRecords,
  importExcel,
};
