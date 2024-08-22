import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/paymentType.js";

const createPaymentType = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { name, status } = value;

    const checkNameDetails = await knex("payment_types")
      .where({ name: name }).whereNot({isDeleted:1})
      .first();
  
    if(checkNameDetails){
      return res.status(409).json({
        error: true,
        message: "Payment type name already exists",
      });
    }

    const insertId = await knex("payment_types").insert({ name, status });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Payment Type",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Payment Type created successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Payment Type",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginatePaymentType = async (req, res) => {
  try {
    const tableName = "payment_types";
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

    // Filter results where not isDeleted
    let results = knex(tableName).where({isDeleted:'0'});

    // Apply status filter if provided
    if (status !== "") {
      results = results.where("status", status);
    }

    // Apply search filter
    if (search) {
      results = results.andWhere(function () {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      });
    }

    // Get total count
    const total = await results.clone().count("id as total").first();

    // Apply sorting, pagination and fetch rows
    let rows = await results.orderBy(sort, order).limit(limit).offset(offset);

    // Prepare data with serial numbers
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr--;
      });
    }

    return res.status(200).json({
      error: false,
      message: "Payment Type retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    // Handle error
    return res.status(500).json({
      error: true,
      message: "Could not fetch Payment Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updatePaymentType = async (req, res) => {
  try {
    const tableName = "payment_types";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { name, id, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const resultx = await knex(tableName)
      .where("name", name)
      .where("id", "!=", id)
      .whereNot("isDeleted",1);
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Payment Type is alredy exist",
      });
    }

    const updationDataIs = await functions.takeSnapShot(tableName, id);

    const insertId = await knex(tableName)
      .update({ name, status })
      .where({ id })
      .andWhereNot({ isDeleted: 1 });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Payment Type",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "payment_types",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }

    return res.status(200).json({
      error: false,
      message: "Payment Type Updated successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Payment Type",
      data: { error: JSON.stringify(error) },
    });
  }
};
const deletePaymentType = async (req, res) => {
  try {
    const tableName = "payment_types";

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
        message: "Could not delete Payment Type",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Payment Type deleted Successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete Payment Type",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewPaymentType = async (req, res) => {
  const tableName = "payment_types";

  const { error, value } = validation.view(req.params);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      data: error,
    });
  }

  const { id } = value;

  const result = await knex(tableName).where({ id }).andWhere({isDeleted:'0'});

  if (result.length == 0) {
    return res.status(404).json({
      error: true,
      message: "Payment Type could not found",
    });
  }

  return res.status(200).json({
    error: false,
    message: "Payment Type retrived successfully",
    data: result,
  });
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "payment_types";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Payment Type",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Payment Type successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Payment Type.",
        data: JSON.stringify(error),
      });
    }
}
const importExcel = async (req, res) => {
  try {
    const tableName = "payment_types";

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
  createPaymentType,
  paginatePaymentType,
  updatePaymentType,
  deletePaymentType,
  viewPaymentType,
  delteMultipleRecords,
  importExcel,
};
