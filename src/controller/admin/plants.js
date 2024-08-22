import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import constants from "../../helpers/constants.js";
import jwt from "jsonwebtoken";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/plants.js";

import { v4 as uuidv4 } from "uuid";

const createPlant = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      code,
      name,
      street,
      city,
      postal_code,
      po_box,
      country_id,
      state_code,
      company_code,
      status,
    } = value;

    const id = uuidv4();

    const checkCountry = await knex("countries").where({ id: country_id });
    if (checkCountry.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Country does not found",
      });
    }

    const checkState = await knex("states").where({ id: state_code });
    if (checkState.length == 0) {
      return res.status(404).json({
        error: true,
        message: "State does not found",
      });
    }

    const checkCompany = await knex("companies").where({ id: company_code });
    if (checkCompany.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Company does not found",
      });
    }

    const result = await knex("plants").where({
      code: code,
      company_code: company_code,
      status: 1,
    }).whereNot({isDeleted:1});
    if (Array.isArray(result) && result.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Plant Code is alredy exist",
      });
    }

    const timestampis = knex.fn.now();

    const insertId = await knex("plants").insert({
      id: id,
      code: code,
      name: name,
      street: street,
      city: city,
      postal_code: postal_code,
      po_box: po_box,
      country_key: country_id,
      state_code: state_code,
      company_code: company_code,
      status: status,
      created_at: timestampis,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Plant could not create",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Plant created successfully.",
      data: {
        insertId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Plant.",
      data: JSON.stringify(error),
    });
  }
};

const paginatePlant = async (req, res) => {
  try {
    const { jwtConfig } = constants;
    const authHeader = req.headers["authorization"];
    let filter;
    let token = authHeader && authHeader.split(" ")[1];
    if (token) {
      const user = jwt.verify(token, jwtConfig.secret);
      const email = user.email;
      const departmentIds = await knex("departments")
        .whereIn("id", function () {
          this.select("department_id")
            .from("supplier_details")
            .where({ emailID: email });
        })
        .select("company_id");

      if (departmentIds.length > 0) {
        filter = departmentIds[0];
      }
    }

    const tableName = "plants";

    const searchFrom = [
      "plants.code",
      "plants.street",
      "plants.po_box",
      "plants.postal_code",
      "plants.city",
      "companies.name",
    ];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,

        message: error.details[0].message,

        data: JSON.stringify(error),
      });
    }

    let {
      offset,
      limit,
      order,
      sort,
      search,
      status,
      country_id,
      state_code,
      company_code,
    } = value;

    let total = 0;

    let results = knex(tableName).where(`${tableName}.isDeleted`,'0')
      .leftJoin("countries", "countries.id", "=", `${tableName}.country_key`)
      .leftJoin("states", "states.id", "=", `${tableName}.state_code`)
      .leftJoin("companies", "companies.id", "=", `${tableName}.company_code`)
      .select(
        `${tableName}.*`,
        "countries.name as country_name",
        "states.stateDesc as state_name",
        "companies.name as company_name"
      );

    if (filter != undefined && filter != "" && filter != null) {
      results = results.where("plants.company_code", filter.company_id);
    }

    if (country_id != undefined && country_id != "") {
      results = results.where("plants.country_key", country_id);
    }
    if (state_code != undefined && state_code != "") {
      results = results.where("plants.state_code", state_code);
    }
    if (company_code != undefined && company_code != "") {
      results = results.where("plants.company_code", company_code);
    }
    if (status != undefined && status != "") {
      total = results.where("plants.status", status);
    }

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    total = await results.count("plants.id as total").first();

    let rows = knex(tableName).where(`${tableName}.isDeleted`,'0')
      .leftJoin("countries", "countries.id", "=", `${tableName}.country_key`)
      .leftJoin("states", "states.id", "=", `${tableName}.state_code`)
      .leftJoin("companies", "companies.id", "=", `${tableName}.company_code`)
      .select(
        `${tableName}.*`,
        "countries.name as country_name",
        "states.stateDesc as state_name",
        "companies.name as company_name"
      );

    if (filter != null) {
      rows = rows.where("plants.company_code", filter.company_id);
    }
    if (country_id != undefined && country_id != "") {
      rows = rows.where("plants.country_key", country_id);
    }
    if (state_code != undefined && state_code != "") {
      rows = rows.where("plants.state_code", state_code);
    }
    if (company_code != undefined && company_code != "") {
      rows = rows.where("plants.company_code", company_code);
    }

    if (status != undefined && status != "") {
      rows.where("plants.status", status);
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    if (filter) {
      rows = await rows.orderBy(sort, order);
    } else {
      rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    }

    let data_rows = [];

    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;

        data_rows.push(row);
        sr--;
      });
    }

    return res.status(200).json({
      error: false,
      message: "Plant retrieved successfully.",
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Plant.",
      data: JSON.stringify(error),
    });
  }
};

const viewPlant = async (req, res) => {
  try {
    const tableName = "plants";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const id = req.params.id;

    const result = await knex(tableName)
      .where(`${tableName}.isDeleted`,'0')
      .leftJoin("countries", "countries.id", "=", `${tableName}.country_key`)
      .leftJoin("states", "states.id", "=", `${tableName}.state_code`)
      .leftJoin("companies", "companies.id", "=", `${tableName}.company_code`)
      .where({
        [`${tableName}.id`]: id,
      })
      
      .select(
        `${tableName}.*`,
        "countries.name as country_name",
        "states.stateDesc as state_name",
        "companies.name as company_name"
      );

    if (result.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Plant Not Found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Plant retrived successfully",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Plant.",
      data: JSON.stringify(error),
    });
  }
};

const deletePlant = async (req, res) => {
  try {
    const tableName = "plants";

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

    // check Plant id is exists or not
    const plantId = await fun.checkCodeExists("plants", "id", id);
    if (plantId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Plant does not exist",
      });
    }

    const check = await knex(tableName)
      .where({
        id,
      }).update('isDeleted',1);
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Plant",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Plant deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Plant.",
      data: JSON.stringify(error),
    });
  }
};

const updatePlant = async (req, res) => {
  try {

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      id,
      code,
      name,
      street,
      city,
      postal_code,
      po_box,
      country_id,
      state_code,
      company_code,
      status,
    } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const checkCountry = await knex("countries").where({ id: country_id });
    if (checkCountry.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Country does not found",
      });
    }

    const checkState = await knex("states").where({ id: state_code });
    if (checkState.length == 0) {
      return res.status(404).json({
        error: true,
        message: "State does not found",
      });
    }

    const checkCompany = await knex("companies").where({ id: company_code });
    if (checkCompany.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Company does not found",
      });
    }

    const checkCode = await knex("plants")
      .where({ code: code })
      .where("id", "!=", id)
      .whereNot("isDeleted",1);

    // const result = await knex("plants").where({
    //   code: code,
    //   company_code: company_code,
    //   status: 1,
    // });
    if (Array.isArray(checkCode) && checkCode.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Plant Code is alredy exist",
      });
    }

    const timestampis = knex.fn.now();

    const updationDataIs = await functions.takeSnapShot("plants", id);
    const insertId = await knex("plants")
      .update({
        code: code,
        name: name,
        street: street,
        city: city,
        postal_code: postal_code,
        po_box: po_box,
        country_key: country_id,
        state_code: state_code,
        company_code: company_code,
        status: status,
        updated_at: timestampis,
      })
      .where({
        id: id,
      });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Plant could not updated",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "plants",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      messsage: "Plant updated successfully.",
      data: {
        updatedId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update Plant.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "plants";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Plants",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Plants successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Plant.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "plants";

    if (!req.files || !req.files.excelfile) {
      return res.status(400).json({
        error: true,
        message: "No file uploaded",
        data: [],
      });
    }

    const headerMappings = {
      code: "code",
      "plant name": "name",
      street: "street",
      city: "city",
      "postal code": "postal_code",
      "po box": "po_box",
      "country code": "country_key",
      state: "state_code",
      "company code": "company_code",
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
      row.id = uuidv4();
      if (row.company_code !== "") {
        const check = await knex("companies")
          .select("id")
          .where({ code: row.company_code });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Company not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.company_code = check[0].id;
      }

      if (row.country_key !== "") {
        const check = await knex("countries")
          .select("id")
          .where({ country_key: row.country_key });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Country not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.country_key = check[0].id;
      }
      if (row.state_code !== "") {
        const check = await knex("states")
          .select("id")
          .where({ stateDesc: row.state_code });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `State not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.state_code = check[0].id;
      }

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
  createPlant,
  paginatePlant,
  viewPlant,
  deletePlant,
  updatePlant,
  delteMultipleRecords,
  importExcel,
};
