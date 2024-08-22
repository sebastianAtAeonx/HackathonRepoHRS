import knex from "../../config/mysql_db.js";
import logs from "../../middleware/logs.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/admin/purchaseGroup.js";

const createPurchaseGroup = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { code, name } = value;
    const data = {
      code,
      name,
    };

    const checkPg = await knex("purchase_groups").where({code}).whereNot({isDeleted:1}).first();
    console.log("checkPg:-", checkPg);
    if (checkPg) {
      return res.status(409).json({
        error: true,
        message: "Purchase code already exists.",
      });
    }

    const checkPg2 = await knex("purchase_groups").where({name}).whereNot({isDeleted:1}).first();
    console.log("checkPg2:-", checkPg2);
    if (checkPg2) {
      return res.status(409).json({
        error: true,
        message: "Purchase group name already exists.",
      });
    }


    const insertPgId = await knex("purchase_groups").insert(data);
    if (!insertPgId) {
      return res.status(500).json({
        error: true,
        message: "Purchase group could not created",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Purchase group created.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create purchase group.",
      data:JSON.stringify(error)
    });
  }
};

const updatePurchaseGroup = async (req, res) => {
  try {
    const tableName = "purchase_groups";
    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, code, name, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const data = {
      code,
      name,
      status,
    };

    const checkPg = await knex("purchase_groups")
      .select("*")
      .where({ code, name })
      .where("id", "!=", id)
      .whereNot("isDeleted",1);

    if (checkPg.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Purchase group already exists.",
      });
    }
    await functions.takeSnapShot("purchase_groups", id);
    const update_pg = await knex("purchase_groups")
      .where({ id })
      .andWhereNot({ isDeleted: 1 })
      .update(data);
    if (!update_pg) {
      return res.status(500).json({
        error: false,
        message: "Purchase groups could not update",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "purchase_groups",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Purchase group updated.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Purchase group.",
      data:JSON.stringify(error)
    });
  }
};

const deletePurchaseGroup = async (req, res) => {
  try {
    const tableName = "purchase_groups";

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

    const delete_pg = await knex("purchase_groups").where({ id }).update({isDeleted:1});
    if (delete_pg) {
      return res.status(200).json({
        message: "Purchase Group deleted successfully",
      });
    } else {
      return res.status(500).json({
        message: "Purchase Group could not delete",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Purchase Group.",
      data:JSON.stringify(error)
    });
  }
};

const viewPurchaseGroup = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    const result = await knex("purchase_groups")
      .select()
      .where({ id })
      .andWhereNot({ isDeleted: 1 });
    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Purchase group not found",
        data: error,
      });
    }
    delete result[0].updated_at;
    delete result[0].created_at;

    return res.status(200).json({
      error: false,
      message: "Purchase Group retrived successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Purchase Group.",
      data:JSON.stringify(error)
    });
  }
};

const paginatePurchaseGroup = async (req, res) => {
  try {
    const tableName = "purchase_groups";
    const searchFrom = ["code", "name"];

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
      message: "Purchase Group retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Purchase Group.",
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "purchase_groups";

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
    return res.status(500).json({
      error: true,
      message: "Could not fetch Purchase Group.",
      data: error.message,
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "purchase_groups";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Purchase Group",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Purchase Group successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Purchase Group.",
        data: JSON.stringify(error),
      });
    }
}

export default {
  createPurchaseGroup,
  updatePurchaseGroup,
  deletePurchaseGroup,
  viewPurchaseGroup,
  paginatePurchaseGroup,
  importExcel,
  delteMultipleRecords,
};
