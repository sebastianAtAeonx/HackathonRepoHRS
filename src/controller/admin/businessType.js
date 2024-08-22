import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/admin/businessType.js";
import logs from "../../middleware/logs.js";

const createBusinessType = async (req, res) => {
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

    const check_business_name = await knex("business_types").where(
      "name",
      name
    ).whereNot({isDeleted:1});

    if (check_business_name.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Business Type name is already exist",
      });
    }

    const insertId = await knex("business_types").insert({ name, status });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Business Type.",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Business Type created successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Business Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginateBusinessType = async (req, res) => {
  try {
    const tableName = "business_types";
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
    let results = knex(tableName).where({isDeleted:'0'});

    let total = 0;

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
      message: "Business Type retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(404).json({
      error: true,
      message: "Could not load Business Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateBusinessType = async (req, res) => {
  try {
    const tableName = "business_types";

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

    const check_name = await knex(tableName)
      .where("name", name)
      .where("id", "!=", id)
      .whereNot("isDeleted",1);

    if (check_name.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Business type already exist",
      });
    }

    const updationDataIs = await functions.takeSnapShot(tableName, id);

    const insertId = await knex(tableName)
      .update({ name, status })
      .where({ id: id })
      .andWhere({isDeleted:'0'});
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Business Type.",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "business_types",
        "id",
        id
      );
    }

    return res.status(200).json({
      error: false,
      message: "Business type Updated successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Business Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};
const deleteBusinessType = async (req, res) => {
  try {
    const tableName = "business_types";

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
        message: "Could not delete Business Type",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Business Type deleted successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete Business Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewBusinessType = async (req, res) => {
  try {
    const tableName = "business_types";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName)
      .where("id", id)
      .andWhere({isDeleted:'0'});

    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Business Type not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Business Type retrived successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Business Type.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "business_types";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more Business Types",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.json({
      error: false,
      message: "Deleted all selected Business Types successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.json({
        error: true,
        message: "Could not delete Business Type",
        data: JSON.stringify(error),
      });
    }
}

const importExcel = async (req, res) => {
  try {
    const tableName = "business_types";

    if (!req.files.excelfile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headerMappings = {
      name: "name",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("name")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.name}`), new Set())
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.name}`;
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
  paginateBusinessType,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
  viewBusinessType,
  delteMultipleRecords,
  importExcel,
};
