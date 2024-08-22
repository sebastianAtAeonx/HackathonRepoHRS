import Joi from "joi";
import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import  logs  from "../../middleware/logs.js";
import validation from "../../validation/admin/company.js";

const createCompany = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, code, subscriber_id, status } = value;


    const checkCompanyDetail = await knex("companies")
      .where({ code })
      .whereNot("isDeleted",1)
      .first();
    if(checkCompanyDetail){
      return res.json({
        error: true,
        message: "Company code already exists.",
      })
    }

    const checkCompanyDetail2 = await knex("companies")
      .where({ name })
      .andWhere("isDeleted",'0')
      .first();
    if(checkCompanyDetail2){
      return res.json({
        error: true,
        message: "Company name already exists.",
      })
    }

    const created_at = knex.fn.now();
    const insertId = await knex("companies").insert({
      name,
      code,
      // subscriber_id,
      status,
      created_at,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Company.",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Company created successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    // fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Company.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginateCompany = async (req, res) => {
  try {
    const tableName = "companies";
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
    let results = knex(tableName).andWhere({isDeleted:'0'});
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
      message: "Could not fetch Company.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewCompany = async (req, res) => {
  try {
    const tableName = "companies";

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
      message: "Could not fetch Company.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateCompany = async (req, res) => {
  try {
    const tableName = "companies";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, id, code, subscriber_id, status } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const updated_at = knex.fn.now();

    const updationDataIs = await functions.takeSnapShot(tableName,id);

    const insertId = await knex(tableName)
      .update({ name, code, subscriber_id, status, updated_at })
      .where({ id:id })
      .andWhere({isDeleted:'0'});
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Company.",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"companies","id",id);
  }
    return res.json({
      error: false,
      message: "Company updated successfully.",
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
      const query = knex(tableName).where({ id }).update("isDeleted","1");
      console.log("query:-", query.toString());
      const check = await query;
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Could not delete company",
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
    const schema = Joi.object({
      name: Joi.string().required(),
      status: Joi.string().valid("0", "1").default("1"),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { name, status } = value;

    const check_company_type = await knex("company_types").where("name", name);
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
      message: "Company Type is created successfully.",
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

    const schema = Joi.object({
      offset: Joi.number().default(0),
      limit: Joi.number().default(50),
      sort: Joi.string().default("id"),
      order: Joi.string().valid("asc", "desc").default("desc"),
      status: Joi.string().valid("0", "1", "").default(""),
      search: Joi.string().allow("", null).default(null),
    });

    const { error, value } = schema.validate(req.body);
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
      message: "Could not fetch Company Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateCompanyType = async (req, res) => {
  try {
    const tableName = "company_types";
    const schema = Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
      status: Joi.string().valid("0", "1").default("1"),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { name, id, status } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const check_name = await knex(tableName)
      .where({ name: name })
      .where("id", "!=", id);

    if (check_name.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Company Type name is already exist",
      });
    }
    const updationDataIs = await functions.takeSnapShot(tableName,id);
    const insertId = await knex(tableName)
      .update({ name, status })
      .where({ id });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Company Type.",
      });
    }
    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"company_types","id",id);
    }
    return res.status(200).json({
      error: false,
      message: "Company type Updated successfully.",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Company Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};
const deleteCompanyType = async (req, res) => {
  try {
    const tableName = "company_types";

    const schema = Joi.object({
      id: Joi.number().required(),
    });

    const { error, value } = schema.validate(req.params);
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

    const check = await knex(tableName).where({ id }).update("isDeleted", 1);  
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Company Type.",
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
      message: "Could not delete Company Type.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewCompanyType = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.number().required(),
    });

    const { error, value } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex("company_types").where("id", id);

    if (!result) {
      return res.status(404).json({
        error: true,
        message: "Company Type does not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Company Type retrived successfully",
      data: result,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch Company Type.",
      data: { error: JSON.stringify(error) },
    });
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

const delteMultipleRecords1=async(req,res)=>{
  try {
    const tableName = "companies";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more Company",
        errors: result.errors,
        deltedIds:result.messages,
      });
    }
  
    return res.json({
      error: false,
      message: "Deleted all selected companies successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.json({
        error: true,
        message: "Could not delete Company",
        data: JSON.stringify(error),
      });
    }
}
const delteMultipleRecords2=async(req,res)=>{
  try {
    const tableName = "company_types";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more Company Type",
        errors: result.errors,
        deltedIds:result.messages,
      });
    }
  
    return res.json({
      error: false,
      message: "Deleted all selected Comapny Types successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.json({
        error: true,
        message: "Could not delete Company Type",
        data: JSON.stringify(error),
      });
    }
}

const importExcel = async (req, res) => {
  try {
    const tableName = "companies";

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

    // Define the Joi schema with custom error messages
    const schema = Joi.object({
      code: Joi.string().required().messages({
        "string.empty": `Code cannot be an empty field`,
        "any.required": `Code is a required field`,
      }),
      name: Joi.string().required().messages({
        "string.empty": `Name cannot be an empty field`,
        "any.required": `Name is a required field`,
      }),
      rowNumber: Joi.number(), // Add the row number to the schema for count row from excel
    });

    const validData = [];
    const errors = [];

    // Validate each row
    for (const row of dataToInsert) {
      const { error } = schema.validate(row);
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
  delteMultipleRecords1,
  delteMultipleRecords2,
  importExcel,
  
};
