import { json } from "express";
import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import fun from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/tds.js";

const createTds = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { type, code, description } = value;

    const checkCode = await knex("tds")
      .where("code", code)
      .where("type", type)
      .whereNot("isDeleted", 1);
    if (checkCode.length > 0) {
      return res.status(404).json({
        error: true,
        message: "Tds already exists",
      });
    }

    const insertTds = await knex("tds").insert({
      type,
      code,
      description,
    });

    if (!insertTds) {
      return res.status(500).json({
        error: true,
        message: "Unable to create Tds",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Tds created successfully",
      data: insertTds,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create Tds.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateTds = async (req, res) => {
  try {
    const tableName = "tds";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id, type, code, description, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const checkCode = await knex("tds")
      .where("code", code)
      .where("type", type)
      .where("id", "!=", id)
      .whereNot("isDeleted",1);
    if (checkCode.length > 0) {
      return res.status(404).json({
        error: true,
        message: "Tds already exists",
      });
    }

    //   const checkName = await knex("tds").where("type", type).where("id", "!=", id);
    //   if (checkName.length > 0) {
    //     return res.json({
    //       error: true,
    //       message: "Tds type already exists",
    //     });
    //   }

    const updationDataIs = await functions.takeSnapShot("tds", id);
    const updateTds = await knex("tds")
      .where({ id })
      .andWhere({isDeleted:'0'})
      .update({ type, code, description, status });
    if (!updateTds) {
      return res.status(500).json({
        error: true,
        message: "Unable to update Tds",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "tds",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Tds updated successfully",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update Tds.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const deleteTds = async (req, res) => {
  try {
    const tableName = "tds";

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

    const deleteTds = await knex("tds").where({ id }).update({ isDeleted: 1 });

    if (!deleteTds) {
      return res.status(500).json({
        error: true,
        message: "Could not delete Tds",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Tds deleted successfully",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete Tds.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewTds = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getTds = await knex("tds")
      .where({ id: id })
      .andWhere({isDeleted:'0'});

    if (getTds.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Tds not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Tds found successfully",
      data: getTds,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch Tds.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const listTds = async (req, res) => {
  try {
    const tableName = "tds";
    const searchFrom = ["type"];

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
      message: "Tds retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load Tds.",
      data: JSON.stringify(error),
    });
  }
};

const filteredList = async (req, res) => {
  try {
    const { error, value } = validation.filteredList(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { type } = value;

    const getTds = await knex("tds").where({ type: type });

    if (getTds.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Tds not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Tds found successfully",
      data: getTds,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load Tds.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const taxTypes = async (req, res) => {
  try {
    const getTds = await knex("tds").distinct("type");

    if (getTds.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Tds not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Tds found successfully",
      data: getTds,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not found Tds.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const headerMappings = {
  "Withholding Tax Type": "type",
  "Withholding Tax Code": "code",
  Name: "description",
};

// const importExcel = async (req, res) => {
//   try {
//     const tableName = "tds";

//     if (!req.files.excelfile) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.load(req.files.excelfile.data);

//     const worksheet = workbook.worksheets[0];

//     const rows = [];
//     let header = [];
//     worksheet.eachRow((row, rowNumber) => {
//       if (rowNumber === 1) {
//         header = row.values.map((cell) => (cell ? cell.toString().trim() : ""));
//       }
//       if (rowNumber !== 1) {
//         rows.push({ rowNumber, values: row.values });
//       }
//     });

//     const hasAllEssentialHeaders = Object.keys(headerMappings).every(
//       (essentialHeader) => header.includes(essentialHeader)
//     );

//     if (!hasAllEssentialHeaders) {
//       return res.status(400).json({
//         error: true,
//         message: "Essential headers are missing in the uploaded file.",
//       });
//     }

//     const srNoIndex = header.indexOf("sr no");
//     const dataToInsert = [];
//     const existingEntries = await knex(tableName)
//       .select("code", "type", "description")
//       .then((rows) =>
//         rows.reduce((acc, row) => acc.add(`${row.code}-${row.type}-${row.description}`), new Set())
//       );

//     for (const row of rows) {
//       const { rowNumber, values } = row;
//       if (
//         srNoIndex !== -1 &&
//         values[srNoIndex].toString().trim().toLowerCase() === "sr no"
//       ) {
//         continue;
//       }

//       const rowData = {};

//       header.forEach((column, index) => {
//         const databaseColumn = headerMappings[column];
//         if (databaseColumn) {
//           const cellValue = values[index]
//             ? values[index].toString().trim()
//             : "";
//           rowData[databaseColumn.toLowerCase()] = cellValue;
//         }
//       });

//       const entryKey = `${rowData.code}-${rowData.type}-${rowData.description}`;

//       if (!existingEntries.has(entryKey)) {
//         dataToInsert.push(rowData);
//       }
//     }

//     if (dataToInsert.length === 0 ) {
//       return res.json({
//         error: true,
//         message: "All data from the Excel file already exists",
//       });
//     }

//     if (dataToInsert.length > 0) {
//       await knex.transaction(async (trx) => {
//         await trx(tableName).insert(dataToInsert);
//       });
//     }

//     return res.json({
//       error: false,
//       message:"Data inserted successfully",
//       details: [],
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something Went Wrong!",
//       data: error.message,
//     });
//   }
// };
const importExcel = async (req, res) => {
  try {
    const tableName = "tds";

    if (!req.files.excelfile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headerMappings = {
      type: "type",
      code: "code",
      description: "description",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("code", "type", "description")
      .then((rows) =>
        rows.reduce(
          (acc, row) => acc.add(`${row.code}-${row.type}-${row.description}`),
          new Set()
        )
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.code}-${rowData.type}-${rowData.description}`;
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
      message: "Unable to import",
      data: error.message,
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "tds";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Tds",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Tds successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

export default {
  createTds,
  updateTds,
  deleteTds,
  viewTds,
  listTds,
  filteredList,
  taxTypes,
  importExcel,
  delteMultipleRecords,
};
