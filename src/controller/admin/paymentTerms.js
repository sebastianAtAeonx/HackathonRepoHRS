import { json } from "express";
import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/paymentTerms.js";

const createPt = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }

    const { code, name } = value;

    const checkCodeName = await knex("payment_terms")
      .where({ code: code })
      .andWhere({isDeleted:'0'})
      .first();

    console.log("checkCodeName:-", checkCodeName);

    if (checkCodeName) {
      return res
        .json({
          error: true,
          message: "Payment terms code already exists. oho!",
        })
        .end();
    }

    const checkCodeName2 = await knex("payment_terms")
      .where({ name: name })
      .andWhereNot({ isDeleted: 1 })
      .first();

    console.log("checkCodeName2:-", checkCodeName2);

    if (checkCodeName2) {
      return res
        .json({
          error: true,
          message: "Payment terms name already exists(1)",
        })
        .end();
    }

    const checkCode = await knex("payment_terms")
      .where("code", code)
      .andWhere({isDeleted:'0'});
    if (checkCode.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Payment terms code already exists",
      });
    }

    const checkName = await knex("payment_terms")
      .where("name", name)
      .andWhere({isDeleted:'0'});
    if (checkName.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Payment terms name already exists(2)",
      });
    }

    const insertPaymentTerms = await knex("payment_terms").insert({
      code,
      name,
    });

    if (!insertPaymentTerms) {
      return res.status(500).json({
        error: true,
        message: "Unable to create payment terms",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Payment terms created successfully",
      data: insertPaymentTerms,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const updatePt = async (req, res) => {
  const tableName = "payment_terms";

  const { error, value } = validation.update(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }
  const { id, name, code, status } = value;

  try {
    await logs.logOldValues(tableName, id, value, req);
  } catch {
    console.log(error);
  }

  const checkCode = await knex("payment_terms")
    .where("code", code)
    .where("id", "!=", id)
    .whereNot("isDeleted",1);
  if (checkCode.length > 0) {
    return res.status(409).json({
      error: true,
      message: "Payment terms code already exists",
    });
  }

  const checkName = await knex("payment_terms")
    .where("name", name)
    .where("id", "!=", id)
    .whereNot("isDeleted",1);
  if (checkName.length > 0) {
    return res.status(409).json({
      error: true,
      message: "Payment terms name already exists(3)",
    });
  }
  const updationDataIs = await functions.takeSnapShot("payment_terms", id);
  const updatePaymentTerms = await knex("payment_terms")
    .where({ id })
    .andWhere({isDeleted:'0'})
    .update({ name, code, status });
  if (!updatePaymentTerms) {
    return res.status(500).json({
      error: true,
      message: "Unable to update payment terms",
    });
  }

  if (id) {
    const modifiedByTable1 = await functions.SetModifiedBy(
      req.headers["authorization"],
      "payment_terms",
      "id",
      id
    );
    console.log("isUpdated:-", modifiedByTable1);
  }
  return res.status(200).json({
    error: false,
    message: "Payment terms updated successfully",
  });
};

const deletePt = async (req, res) => {
  try {
    const tableName = "payment_terms";

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

    const deletePaymentTerms = await knex("payment_terms")
      .where({ id })
      .update({ isDeleted: 1 });

    if (!deletePaymentTerms) {
      return res.json({
        error: true,
        message: "Payment Terms could not delete",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Payment Terms deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Could not delete", data: error.message })
      .end();
  }
};

const viewPt = async (req, res) => {
  const { error, value } = validation.view(req.params);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { id } = value;

  const getPaymentTerms = await knex("payment_terms")
    .where({ id: id })
    .andWhere({isDeleted:'0'});

  if (getPaymentTerms.length <= 0) {
    return res.status(404).json({
      error: true,
      message: "Payment terms not found",
    });
  }

  return res.status(200).json({
    error: false,
    message: "Payment terms found successfully",
    data: getPaymentTerms,
  });
};

const listPt = async (req, res) => {
  try {
    const tableName = "payment_terms";
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
      message: "Payment Terms retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch Payment Terms.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "payment_terms";

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
      message: "Unable to import data",
      data: error.message,
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "payment_terms";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Payment Terms",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Payment Terms successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Payment Terms.",
      data: JSON.stringify(error),
    });
  }
};
export default {
  createPt,
  updatePt,
  deletePt,
  viewPt,
  listPt,
  importExcel,
  delteMultipleRecords,
};
