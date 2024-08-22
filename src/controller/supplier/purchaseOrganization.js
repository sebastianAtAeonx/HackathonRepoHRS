import knex from "../../config/mysql_db.js";
import ExcelJS from "exceljs";
import fun from "../../helpers/functions.js";
import validation from "../../validation/supplier/purchaseOrganization.js";

const createPurchaseOrganization = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const checkCompany = await knex("companies").where("id", value.company_id);

    if (checkCompany.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Company doesn't exist",
      });
    }
    const checkPG = await knex("purchase_groups").where(
      "id",
      value.purchase_group_id
    );

    if (checkPG.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Purchase Group doesn't exist",
      });
    }
    const purchaseData = await knex("purchase_organization").insert(value);

    if (!purchaseData) {
      return res.status(500).json({
        error: true,
        message: "Error while creating Purchase Organization",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Purchase Organization created succesfully !",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error.message),
    });
  }
};

const listPurchaseOrganization = async (req, res) => {
  try {
    const tableName = "purchase_organization";

    const { error, value } = validation.view(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    const result = await knex(`${tableName}`)
      .select(
        `${tableName}.id`,
        `${tableName}.code`,
        `${tableName}.description`,
        `${tableName}.company_id`,
        `${tableName}.created_at`,
        `${tableName}.updated_at`,
        "companies.name as company",
        `${tableName}.purchase_group_id`,
        "purchase_groups.name as purchase_group"
      )
      .join("companies", `${tableName}.company_id`, "=", "companies.id")
      .join(
        "purchase_groups",
        `${tableName}.purchase_group_id`,
        "=",
        "purchase_groups.id"
      )
      .where({ [`${tableName}.id`]: id });

    if (result.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Purchase Organization not found",
        data: [],
      });
    }

    res.status(200).json({
      error: false,
      message: "Retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Something went wrong !",
      data: JSON.stringify(error.message),
    });
  }
};

const updatePurchaseOrganization = async (req, res) => {
  try {
    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const select = await knex("purchase_organization")
      .where({ id: value.id })
      .select();

    if (select.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Purchase Organization not found",
        data: [],
      });
    }

    const checkCompany = await knex("companies").where("id", value.company_id);

    if (checkCompany.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Company doesn't exist",
      });
    }
    const checkPG = await knex("purchase_groups").where(
      "id",
      value.purchase_group_id
    );

    if (checkPG.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Purchase Group doesn't exist",
      });
    }
    const updatedRows = await knex("purchase_organization")
      .where({ id: value.id })
      .update(value);

    if (updatedRows === 0) {
      return res.status(500).json({
        error: true,
        message: "Failed to update Purchase Organization.",
        data: [],
      });
    }

    return res.status(200).json({
      error: false,
      message: "Purchase Organization updated successfully",
      data: value,
    });
  } catch (err) {
    console.error("Error updating purchase:", err);
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(err.message),
    });
  }
};

const deletePurchaseOrganization = async (req, res) => {
  try {
    const { error, value } = validation.del(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    const deletedData = await knex("purchase_organization")
      .where({ id: id })
      .update("isDeleted", 1);

    if (!deletedData) {
      return res.status(404).json({
        error: true,
        message: "Purchase Organization not found or already deleted",
        data: [],
      });
    }

    res.status(200).json({
      error: false,
      message: "Purchase Orghanization deleted successfully",
      data: {
        id: id,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const paginatePO = async (req, res) => {
  try {
    const tableName = "purchase_organization";

    const searchFrom = [
      "purchase_organization.description",
      "purchase_organization.code",
      "companies.name",
      "purchase_groups.name",
    ];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status, filter } = value;
    let rows = knex(`${tableName}`)
      .select(
        `${tableName}.*`,
        "companies.name as company",
        "purchase_groups.name as purchase_group"
      )
      .join("companies", `${tableName}.company_id`, "=", "companies.id")
      .join(
        "purchase_groups",
        `${tableName}.purchase_group_id`,
        "=",
        "purchase_groups.id"
      );

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        if (dateField === "created_at") {
          rows.whereBetween(`${tableName}.created_at`, [
            startDateISO,
            endDateISO,
          ]);
        } else if (dateField === "updated_at") {
          rows.whereBetween(`${tableName}.updated_at`, [
            startDateISO,
            endDateISO,
          ]);
        }
      }
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(`${element}`, `%${search}%`);
          });
        });
      }
    });

    const total = await rows
      .clone()
      .count("purchase_organization.id as total")
      .first();
    rows = await rows
      .orderBy(`${tableName}.${sort}`, order)
      .limit(limit)
      .offset(offset);

    let data_rows = [];
    let sr;
    if (order === "desc") {
      sr = offset + 1;
    } else {
      sr = total.total - limit * offset;
    }
    rows.map(async (row) => {
      const Delete = [];

      for (const key of Delete) {
        delete row[key];
      }
      // Assign the pr_data array to the row
      row.sr = sr;
      if (order == "desc") {
        sr++;
      } else {
        sr--;
      }
      data_rows.push(row);
    });
    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

// Excel Import
const headerMappings = {
  "Purch. Organization": "code",
  "Purch. org. descr.": "name",
  "Company Code": "company_id",
};

const importExcel = async (req, res) => {
  try {
    const tableName = "purchase_organization";

    if (!req.files.excelfile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.files.excelfile.data);

    const worksheet = workbook.worksheets[0];

    const rows = [];
    let header = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        header = row.values.map((cell) => (cell ? cell.toString().trim() : ""));
      }
      if (rowNumber !== 1) {
        rows.push({ rowNumber, values: row.values });
      }
    });

    const hasAllEssentialHeaders = Object.keys(headerMappings).every(
      (essentialHeader) => header.includes(essentialHeader)
    );
    if (!hasAllEssentialHeaders) {
      return res.status(400).json({
        error: true,
        message: "Essential headers are missing in the uploaded file.",
      });
    }

    const srNoIndex = header.indexOf("sr no");
    const dataToInsert = [];
    const existingEntries = await knex(tableName)
      .select("code", "name", "company_id")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.code}-${row.name}`), new Set())
      );

    const errorMessages = [];

    for (const row of rows) {
      const { rowNumber, values } = row;
      if (
        srNoIndex !== -1 &&
        values[srNoIndex].toString().trim().toLowerCase() === "sr no"
      ) {
        continue;
      }

      const rowData = {};

      header.forEach((column, index) => {
        const databaseColumn = headerMappings[column];
        if (databaseColumn) {
          const cellValue = values[index]
            ? values[index].toString().trim()
            : "";
          rowData[databaseColumn.toLowerCase()] = cellValue;
        }
      });

      if (!/^\d+$/.test(rowData.code)) {
        continue;
      }

      const entryKey = `${rowData.code}-${rowData.name}`;
      let company;
      if (rowData.company_id !== "") {
        company = await knex("companies")
          .select("id")
          .where("code", rowData.company_id)
          .first();
        if (!company) {
          errorMessages.push(
            `Company with code ${rowData.company_id} not found at cell C${rowNumber}`
          );
          continue;
        }
      }

      rowData.company_id = company ? company.id : "";

      if (!existingEntries.has(entryKey)) {
        dataToInsert.push(rowData);
      }
    }
    console.log(errorMessages);

    if (dataToInsert.length === 0 && errorMessages.length === 0) {
      return res.json({
        error: true,
        message: "All data from the Excel file already exists",
      });
    }

    if (dataToInsert.length > 0) {
      await knex.transaction(async (trx) => {
        await trx(tableName).insert(dataToInsert);
      });
    }

    return res.status(200).json({
      error: errorMessages.length > 0,
      message:
        errorMessages.length > 0
          ? "Errors encountered during processing"
          : "Data inserted successfully",
      details: errorMessages,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not import record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "purchase_organization";
    const { ids } = req.body;

    const result = await fun.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected records successfully",
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
  createPurchaseOrganization,
  updatePurchaseOrganization,
  deletePurchaseOrganization,
  listPurchaseOrganization,
  paginatePO,
  importExcel,
  delteMultipleRecords,
};
