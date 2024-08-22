import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/businessPartnerGroup.js";
import { v4 as uuidv4 } from "uuid";

const createBps = async (req, res) => {
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

    // check business partner group code is unique or not
    const bpsCode = await knex("business_partner_groups")
      .where({ code: code })
      .andWhere({ isDeleted: '0' })
      .first();

    console.log("bps:-", bpsCode);

    if (bpsCode) {
      return res.status(409).json({
        error: true,
        message: "Business partner group code is already exists",
      });
    }

    // const id = uuidv4();
    const timestamps = knex.fn.now();

    const insertId = await knex("business_partner_groups").insert({
      code,
      name,
      status
    });

    console.log("insertId:-", insertId);

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create Business Partner Group",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Business partner group created successfully",
      data: insertId,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Business Partner Group.",
      data: JSON.stringify(error),
    });
  }
};

const paginateBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";
    const searchFrom = ["code", "name"];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, sort, order, search, status } = value;

    let results = knex(tableName).where({isDeleted:'0'});

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    const total = await results.count("id as total").first();

    let rows = knex(tableName).where({isDeleted:'0'});

    if (status != undefined && status != "") {
      rows = rows.where(`${tableName}.status`, status);
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
      message: "Business Partner Group retrived successfully",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Business Partner Group.",
      data: JSON.stringify(error),
    });
  }
};

const viewBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";
    const id = req.params.id;

    const result = await knex(tableName)
      .where({ id: id })
      .andWhere({isDeleted:'0'});

    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Business partner group not found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Business Partner Group retrived successfully.",
      data: { result },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Business Partner Group.",
      data: JSON.stringify(error),
    });
  }
};

const deleteBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";

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

    // check bpg id is exists or not
    const bpgId = await fun.checkCodeExists(tableName, "id", id);
    if (bpgId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Business partner group not found",
      });
    }

    const check = await knex(tableName).where({ id }).update({ isDeleted: 1 });

    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Business Partner Group could not delete",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Business Partner Group deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Business Partner Group.",
      data: JSON.stringify(error),
    });
  }
};

const updateBps = async (req, res) => {
  try {
    const tableName = "business_partner_groups";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, name, code, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    // check bpg id is exists or not
    const bpgId = await fun.checkCodeExists(tableName, "id", id);
    if (bpgId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Business partner group not found",
      });
    }

    const timestamps = knex.fn.now();

    const resultx = await knex(tableName)
      .where({ code: code })
      .where("id", "!=", id)
      .whereNot("isDeleted",1);
    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Business partner group code already exists.",
      });
    }

    const updationDataIs = await functions.takeSnapShot(tableName, id);

    const updateId = await knex(tableName)
      .update({
        name,
        code,
        status,
        updated_at: timestamps,
      })
      .where({ id: id })
      .andWhereNot({ isDeleted: 1 });

    if (!updateId) {
      return res.status(500).json({
        error: true,
        message: "Could not update Business Partner Group",
      });
    }

    //modifiedBy ...
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "business_partner_groups",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    //modifiedBy over

    return res.status(200).json({
      error: false,
      message: "Business Partner Group update successfully.",
      data: { updatedId: id },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update Business Partner Group.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "business_partner_groups";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more Business Partner Groups",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.json({
      error: false,
      message: "Deleted all selected Business Partner Groups successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not delete Business Partner Group.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "business_partner_groups";

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
  createBps,
  paginateBps,
  viewBps,
  deleteBps,
  updateBps,
  delteMultipleRecords,
  importExcel,
};
