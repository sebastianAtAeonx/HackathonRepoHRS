import knex from "../../config/mysql_db.js";
import s3 from "../../s3/s3.js";
import constants from "../../helpers/constants.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/reconciliation.js";

const paginateReconciliation = async (req, res) => {
  try {
    const tableName = "reconciliation_ac";
    const searchFrom = ["name", "co_names"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.json({
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
      message: "Reconciliation retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not load Reconciliation.",
      data: JSON.stringify(error),
    });
  }
};

const createReconciliation = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { code, name, co_names } = value;

    const check_code = await knex("reconciliation_ac").where({ code: code }).whereNot({isDeleted:1});

    if (check_code.length > 0)
      return res.status(409).json({
        error: true,
        message: "Reconciliation code already exists",
      });

    const insertedId = await knex("reconciliation_ac").insert({
      code,
      name,
      co_names,
    });

    if (insertedId <= 0) {
      return res.status(500).json({
        error: true,
        message: "Reconcilation could not be created",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Reconciliation created successfully",
      data: insertedId,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Reconciliation.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "reconciliation_ac";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Reconciliation",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Reconciliation successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Reconciliation.",
        data: JSON.stringify(error),
      });
    }
}

const deleteReconcilition = async (req, res) => {
  try {
    const tableName = "reconciliation_ac";
    const { error, value } = validation.del(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const select = await knex(tableName).where({ id }).first();

    if (!select) {
      return res.status(404).json({
        error: true,
        message: "Reconciliation not Found !",
        data: [],
      });
    }
    const result = await knex(tableName).where({ id }).update({isDeleted:1});
    if(!result){
      return res.status(500).json({
        error: true,
        message: "Reconciliation could not delete",
        data: [],
      });
    }
    return res.status(200).json({
      error: false,
      message: "Reconciliation deleted Successfully.",
      data: value,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not delete Reconciliation.",
      data: error.message,
    });
  }
};

const updateReconciliation = async (req, res) => {
  try {
    const tableName = "reconciliation_ac";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const select = await knex(tableName).where({ id: value.id }).first();

    if (!select) {
      return res.status(404).json({
        error: true,
        message: "Reconciliation not Found !",
        data: [],
      });
    }

    await knex(tableName)
      .where({ id: value.id })
      .andWhereNot({ isDeleted: 1 })
      .update(value);

    return res.status(200).json({
      error: false,
      message: "Reconciliation updated Successfully.",
      data: value,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not update Reconciliation.",
      data: error.message,
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "reconciliation_ac";
    if (!req.files.excelfile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headerMappings = {
      code: "code",
      name: "name",
      "company name": "co_names",
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
  paginateReconciliation,
  createReconciliation,
  deleteReconcilition,
  updateReconciliation,
  delteMultipleRecords,
  importExcel,
};
