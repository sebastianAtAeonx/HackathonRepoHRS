import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/vendorSchema.js";

const createVendorSchema = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { code, name, status } = value;

    const checkVendorSchemasDetails = await knex("vendor_schemas")
      .where({
        code,
      })
      .andWhere({isDeleted:'0'})
      .first();

    if (checkVendorSchemasDetails) {
      return res.status(409).json({
        error: true,
        message: "Vendor Schema code already exists.",
      });
    }

    const checkVendorSchemasDetails2 = await knex("vendor_schemas")
      .where({
        name,
      })
      .andWhere({isDeleted:'0'})
      .first();

    if (checkVendorSchemasDetails2) {
      return res.status(409).json({
        error: true,
        message: "Vendor Schema name already exists.",
      });
    }

    const created_at = knex.fn.now();

    const insertInVendorSchema = await knex("vendor_schemas").insert({
      code,
      name,
      status,
      created_at,
    });
    if (!insertInVendorSchema) {
      return res.status(500).json({
        error: true,
        message: "Vendor Schema could not create",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Vendor Schema created successfully",
      insertInVendorSchema: insertInVendorSchema[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Vendor Schema",
      data: JSON.stringify(error),
    });
  }
};

const viewVendorSchema = async (req, res) => {
  try {
    const tableName = "vendor_schemas";
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName)
      .where({
        id: id,
      })
      .andWhereNot({ isDeleted: 1 });
    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Vendor Schema not found",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Vendor Schema found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Vendor Schema.",
      data: JSON.stringify(error),
    });
  }
};

const updateVendorSchema = async (req, res) => {
  try {
    const tableName = "vendor_schemas";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, name, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const updated_at = knex.fn.now();
    const updationDataIs = await functions.takeSnapShot("vendor_schemas", id);

    const updateInVendorSchema = await knex("vendor_schemas")
      .where({ id: id })
      .andWhereNot({ isDeleted: 1 })
      .update({
        name,
        status,
        updated_at,
      });
    if (!updateInVendorSchema) {
      return res.status(500).json({
        error: true,
        message: "Vendor Schema could not update",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "vendor_schemas",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Vendor Schema updated successfully",
      updateInVendorSchema: updateInVendorSchema[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update Vendor Schema.",
      data: JSON.stringify(error),
    });
  }
};

const deleteVendorSchema = async (req, res) => {
  try {
    const tableName = "vendor_schemas";
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
      .where({
        id: id,
      })
      .update({ isDeleted: 1 });
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Vendor Schema deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Vendor Schema",
      data: JSON.stringify(error),
    });
  }
};

const paginateVendorSchema = async (req, res) => {
  try {
    const tableName = "vendor_schemas";
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
      message: "Vendor Schema retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load Vendor Schema.",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "vendor_schemas";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Vendor Schema",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Vendor Schema successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Vendor Schema.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "vendor_schemas";

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
  createVendorSchema,
  viewVendorSchema,
  updateVendorSchema,
  paginateVendorSchema,
  deleteVendorSchema,
  importExcel,
  delteMultipleRecords,
};
