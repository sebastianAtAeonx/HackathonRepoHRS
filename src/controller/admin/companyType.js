import knex from "../../../src/config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/companyType.js";
import validCompany from "../../validation/admin/company.js";

const createCompany = async (req, res) => {
  try {
    const { error, value } = validCompany.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, code, subscriber_id, status } = value;
    const created_at = knex.fn.now();
    const insertId = await knex("companies").insert({
      name,
      code,
      subscriber_id,
      status,
      created_at,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Company",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Company created successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Company",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginateCompany = async (req, res) => {
  try {
    const tableName = "companies";
    const searchFrom = ["name"];

    const { error, value } = validCompany.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let total = 0;
    let results = knex(tableName).where({isDeleted:'0'});
    if (status != undefined && status != "") {
      total = results.where("companies.status", status);
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
      message: "Company retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load Company",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewCompany = async (req, res) => {
  try {
    const tableName = "companies";

    const { error, value } = validCompany.view(req.params);
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
        message: "Company not found",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Company found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch Company",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateCompany = async (req, res) => {
  try {
    const tableName = "companies";

    const { error, value } = validCompany.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, id, code, subscriber_id, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const updated_at = knex.fn.now();

    const updationDataIs = await functions.takeSnapShot(tableName, id);
    const insertId = await knex(tableName)
      .update({ name, code, subscriber_id, status, updated_at })
      .where({ id });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Company.",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "companies",
        "id",
        id
      );
    }
    return res.status(200).json({
      error: false,
      message: "Company Updated successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Company.",
      data: { error: JSON.stringify(error) },
    });
  }
};
const deleteCompany = async (req, res) => {
  try {
    const tableName = "companies";

    const { error, value } = validCompany.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const check = await knex(tableName).where({ id }).update('isDeleted', 1); 
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Company.",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Company deleted successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete Company.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const createCompanyType = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, status } = value;

    const check_company_type = await knex("company_types").where("name", name).whereNot({isDeleted:1});
    if (check_company_type.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Company Type name is already exist",
      });
    }

    const insertId = await knex("company_types").insert({ name, status });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Company Type.",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Company Type created successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Company Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginateCompanyType = async (req, res) => {
  try {
    const tableName = "company_types";
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
      message: "Company Type retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load Company Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateCompanyType = async (req, res) => {
  try {
    const tableName = "company_types";

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
      .where({ name: name })
      .where("id", "!=", id)
      .whereNot("isDeleted",1);

    if (check_name.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Company Type name is already exist",
      });
    }
    const updationDataIs = await functions.takeSnapShot(tableName, id);
    const updateId = await knex(tableName)
      .update({
        name,
        status,
      })
      .where({ id: id })
      .andWhereNot({ isDeleted: 1 });

    if (!updateId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Company Type.",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "company_types",
        "id",
        id
      );
    }

    return res.status(200).json({
      error: false,
      message: "Company Type updated successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Company Type",
      data: { error: JSON.stringify(error) },
    });
  }
};
const deleteCompanyType = async (req, res) => {
  try {
    const tableName = "company_types";

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
        message: "Could not delete Company Type",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Company Type deleted Successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete Company Type",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewCompanyType = async (req, res) => {
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

    const result = await knex("company_types").where("id", id).whereNot({isDeleted:1});

    if (!result) {
      return res.status(404).json({
        error: true,
        message: "Company Type not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Company type retrived successfully",
      data: result,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return (
      res.status(500),
      json({
        error: true,
        message: "Could not fetch Company Type.",
        data: { error: JSON.stringify(error) },
      })
    );
  }
};

const getStates = async (req, res) => {
  try {
    const data = await knex("gst_states");
    return res.status(200).json({
      error: false,
      message: "Data recieved successfully",
      data,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "company_types";

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

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "company_types";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
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
};

export default {
  createCompanyType,
  paginateCompanyType,
  viewCompany,
  updateCompanyType,
  deleteCompanyType,
  viewCompanyType,
  createCompany,
  updateCompany,
  deleteCompany,
  paginateCompany,
  getStates,
  importExcel,
  delteMultipleRecords,
};
