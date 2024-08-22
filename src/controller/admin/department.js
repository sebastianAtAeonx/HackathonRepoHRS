import Joi from "joi";
import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import { v4 as uuidv4 } from "uuid";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/department.js";

const deleteDepartment = async (req, res) => {
  try {
    const tableName = "departments";
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

    const check = await knex(tableName)
      .where({ id: id })
      .update("isDeleted", '1');
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Department",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Department deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Department.",
      data: JSON.stringify(error),
    });
  }
};

const paginateDepartment = async (req, res) => {
  try {
    const tableName = "departments";
    const searchFrom = ["departments.name"];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: JSON.stringify(error),
      });
    }

    const { offset, limit, order, sort, search, status, companyId } = value;

    // Base query for filtering
    let query = knex(tableName)
      .where(`${tableName}.isDeleted`, '0')
      .join("companies", `${tableName}.company_id`, "companies.id")
      .select(`${tableName}.*`, "companies.name as company_name");

    // Apply companyId filter if provided
    if (companyId) {
      query = query.where(`${tableName}.company_id`, companyId);
    }

    // Apply status filter if provided
    if (status !== "") {
      query = query.where(`${tableName}.status`, status);
    }

    // Apply search filter if provided
    if (search) {
      query = query.andWhere(function () {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      });
    }

    // Get total count before pagination
    const total = await query.clone().count(`${tableName}.id as total`).first();

    // Apply sorting and pagination
    query = query
      .orderBy(`${tableName}.${sort}`, order)
      .limit(limit)
      .offset(offset);

    // Execute the query to get the rows
    const rows = await query;

    // Add serial numbers to the rows
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

    // Return the final response
    res.status(200).json({
      error: false,
      message: "Department retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Department.",
      data: JSON.stringify(error),
    });
  }
};

const viewDepartment = async (req, res) => {
  try {
    const tableName = "departments";

    const { error, value } = validation.view(req.params);
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
        message: "Department not found",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Department found successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Department.",
      data: JSON.stringify(error),
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      company_id = 9999,
      department_name,
      
      status,
      // dept_type
    } = value;
    

    const id = uuidv4();

    if (company_id != 0) {
      const result = await knex("companies").where({ id: company_id });

      if (Array.isArray(result) && result.length <= 0) {
        return res.json({
          error: true,
          message: "company does not exist",
        });
      }
    }

    const timestampis = knex.fn.now();



    const check_department_name = await knex("departments").where({
      name: department_name,
    }).andWhere({isDeleted:'0'});
    if (
      Array.isArray(check_department_name) &&
      check_department_name.length != 0
    ) {
      res.json({
        error: true,
        message: "Department's name is alredy there",
      });
      return res.end();
    }

    //generate slug

    let generated_slug;
    let generated_slug_international;
    let check_portal_code_existance;

    do {
      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      generated_slug = "dx" + randomNumber;
      generated_slug_international = "ix" + randomNumber;

      check_portal_code_existance = await knex("departments").where(
        "slug",
        generated_slug
      );
    } while (check_portal_code_existance.length > 0);

    const insertId = await knex("departments").insert({
      id: id,
      company_id: company_id,
      name: department_name,
      email: null,
      portal_code_name: null,
      status: status,
      slug: generated_slug,
      slugInternational: generated_slug_international,
      created_at: timestampis,
    });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Department",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Department created successfully.",
      data: {
        insertId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Department.",
      data: JSON.stringify(error),
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const tableName = "departments";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { company_id, name, email, id, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    if (fun.validateEmail(email)) {
    } else {
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const result = await knex("companies").where({ id: company_id });

    if (Array.isArray(result) && result.length <= 0) {
      return res.json({
        error: true,
        message: "company does not exist",
      });
    }

    const timestampis = knex.fn.now();

    const resultx = await knex("departments")
      .where({ email: email })
      .where("id", "!=", id);
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.json({
        error: true,
        message: "Department's email is alredy exist",
      });
    }

    const check_department_name = await knex("departments")
      .where({ name: name })
      .where("id", "!=", id);
    if (
      Array.isArray(check_department_name) &&
      check_department_name.length != 0
    ) {
      return res.status(409).json({
        error: true,
        message: "Department name is alredy exist",
      });
    }

    const updationDataIs = await functions.takeSnapShot(tableName, id);

    const insertId = await knex(tableName)
      .update({ company_id, name, email, status, updated_at: timestampis })
      .where({ id: id });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Department.",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "departments",
        "id",
        id
      );
    }
    return res.status(200).json({
      error: false,
      message: "Department updated successfully.",
      data: {
        updatedId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update Department.",
      data: JSON.stringify(error),
    });
  }
};

const makeGroup = async (req, res) => {
  try {
    const schema = Joi.object({
      group_id: Joi.string().required().trim(),
      dept_id: Joi.array().items(Joi.string().required()).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { dept_id, group_id } = value;

    let mydata = [];

    dept_id.forEach((element) => {
      const mygroup = { group_id: group_id, department_id: element };
      mydata.push(mygroup);
    });

    const result = await knex("department_groups").insert(mydata);

    if (!result) {
      return res.status(500).json({
        message: "Could not create Department Group",
      });
    }

    return res.status(201).json({
      message: "Department Group created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Department Group",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "departments";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more Departments",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.json({
      error: false,
      message: "Deleted all selected Departments successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not delete department",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "departments";

    if (!req.files || !req.files.excelfile) {
      return res.status(400).json({
        error: true,
        message: "No file uploaded",
        data: [],
      });
    }

    const headerMappings = {
      "company code": "company_id",
      "department name": "name",
      email: "email",
      // "portal code": "portal_code",
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
      row.id = uuidv4();
      if (row.company_id !== "") {
        const check = await knex("companies")
          .select("id")
          .where({ code: row.company_id });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Company not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.company_id = check[0].id;
      }

      if (row.company_id === "") {
        row.company_id = 9999;
      }

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
    console.log(validData);
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
  paginateDepartment,
  viewDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  makeGroup,
  delteMultipleRecords,
  importExcel,
};
