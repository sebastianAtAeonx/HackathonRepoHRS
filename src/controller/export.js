import functions from "../helpers/functions.js";
import knex from "../config/mysql_db.js";
import path from "path";
import Joi from "joi";
import ExcelJS from "exceljs";
import s3 from "../s3/s3.js";
import validation from "../validation/export.js";

const fetchFields = async (req, res) => {
  try {
    const { table_name } = req.body;
    if (!table_name) {
      return res.json({ error: true, message: "Table name is required" });
    }

    // Fetch columns of the specified table
    const columns = await knex("information_schema.columns")
      .distinct("column_name as column_name")
      .where("table_schema", "supplierx_dev")
      .andWhere("table_name", table_name)
      .orderBy("ordinal_position");

    const fieldNames = columns.map((column) => column.column_name);

    if (fieldNames.length === 0) {
      return res.json({
        error: true,
        message: "Table doesn't exist or has no fields",
      });
    }
    // Fetch referencing tables
    const foreignKeys = await knex("information_schema.key_column_usage")
      .select(knex.raw("table_name as table_name"))
      .distinct()
      .where("referenced_table_name", table_name);
    // Extract referencing table names
    const referencingTables = foreignKeys.map((key) => key.table_name);

    // Fetch fields of referencing tables
    const allFields = [];
    for (const referencingTable of referencingTables) {
      const referencingColumns = await knex("information_schema.columns")
        .distinct("column_name as column_name")
        .where("table_name", referencingTable)
        .orderBy("ordinal_position");

      const referencingFieldNames = referencingColumns
        .map((column) => column.column_name)
        .filter((fieldName) => {
          return (
            !fieldName.toLowerCase().includes("id") &&
            !fieldName.toLowerCase().includes("created_at") &&
            !fieldName.toLowerCase().includes("updated_at") &&
            !fieldName.includes("createdAt") &&
            !fieldName.includes("updatedAt")
          );
        });
      allFields.push(referencingFieldNames);
    }
    // Merge table names and flatten fields array
    const tables = [table_name, ...referencingTables];
    const fields = [fieldNames, ...allFields].flat();
    // .filter((fieldName) => !fieldName.toLowerCase().includes("id"));

    return res.json({
      error: false,
      message: "Fields fetched successfully",
      tables: tables,
      fields: fields,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: error.message,
    });
  }
};

const excelExport = async (req, res) => {
  try {
    let fileName = req.body.table_name;
    const data = await fetchData(req);

    const filePath = await functions.generateUniqueFilePath(`${fileName}.xlsx`);
    const excelContent = await generateExcelContent(data);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );
    res.send(excelContent);
    console.log(`Data exported successfully.`);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: error.message,
    });
  }
};

async function generateExcelContent(rows) {
  console.log(rows.length)
  console.log("In general excel content");
  const validUrlPattern = /^(http|https):\/\/[^ "]+$/; // Define validUrlPattern here
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  const headers = Object.keys(rows[0]);
  const headerRow = worksheet.addRow(headers);
  // Set background color for header cells
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" }, // Yellow Color
    };
    cell.font = { bold: true, size: 12 };
  });
  let rowNumber = worksheet.lastRow.number;

  // Fetch all images concurrently
  const imagePromises = [];
  rows.forEach((row) => {
    Object.values(row).forEach((value) => {
      if (typeof value === "string" && validUrlPattern.test(value)) {
        const url = new URL(value);
        const extension = url.pathname.split(".").pop().toLowerCase();
        if (extension.match(/^(jpg|jpeg|png|gif|jfif)$/)) {
          imagePromises.push(functions.urlToBuffer(value));
        }
      }
    });
  });
  const images = await Promise.all(imagePromises);
  const imageWidth = 25;
  const imageHeight = 25;
  for (const [index, row] of rows.entries()) {
    const rowData = headers.map((header) => row[header]);

    if (rowData.length !== headers.length) {
      console.error("Row data does not match the number of headers");
      continue;
    }

    rowNumber++;
    // if (rowNumber > 1) {
    //   worksheet.getRow(rowNumber).height = 50;
    // }
    worksheet.getRow(rowNumber).values = rowData;

    rowData.forEach(async (value, i) => {
      const field = headers[i];
      if (typeof value === "string" && validUrlPattern.test(value)) {
        const url = new URL(value);
        const extension = url.pathname.split(".").pop().toLowerCase();
        if (extension === "pdf") {
          const pdfName = decodeURIComponent(
            value.split("/").pop().split("?")[0]
          );
          const cell = worksheet.getCell(rowNumber, i + 1);
          cell.value = { text: pdfName, hyperlink: value };
          cell.style = {
            font: { color: { argb: "0000FF" }, underline: true },
          };
          cell.alignment = {
            horizontal: "left",
            vertical: "bottom",
            wrapText: true,
          };
          worksheet.getRow(rowNumber).height = 50;
        } else if (extension.match(/^(jpg|jpeg|png|gif|jfif)$/)) {
          const imageBuffer = images.shift();
          if (imageBuffer) {
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: extension,
            });

            worksheet.getCell(rowNumber, i + 1).value = null;
            // const imageWidth = 25;
            // const imageHeight = 25;

            worksheet.addImage(imageId, {
              tl: { col: i, row: rowNumber - 1 },
              br: { col: i + 1, row: rowNumber },
              ext: { width: imageWidth, height: imageHeight },
            });
            worksheet.getRow(rowNumber).height = 50;
          } else {
            // Set cell value to empty string if image is not found
            worksheet.getCell(rowNumber, i + 1).value = null;
          }
        } else {
          // For other URLs
          const cell = worksheet.getCell(rowNumber, i + 1);
          cell.value = { text: value, hyperlink: value };
          cell.style = {
            font: { color: { argb: "0000FF" }, underline: true },
          };
          cell.alignment = {
            horizontal: "left",
            vertical: "bottom",
            wrapText: true,
          };
          // worksheet.getRow(rowNumber).height = 50;
        }
      }
    });
  }
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      let cellValue = cell.value;
      if (cellValue instanceof Date) {
        cellValue = cellValue.toISOString().split("T")[0];
      }
      const columnLength = cellValue ? cellValue.toString().length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength <= 20 ? 25 : maxLength >= 50 ? 25 : maxLength;
    // column.width = 25;
  });

  console.log("returning buffer");
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/// field array code
// const fetchData = async (req, res) => {
//   console.log("In Fetch Data");
//   try {
//     // const token = req.headers["authorization"];

//     // if (!token) {
//     //   return res.json({
//     //     error: true,
//     //     message: "Token is required.",
//     //   });
//     // }

//     // const { jwtConfig } = constant;
//     // const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//     // console.log(payload)
//     // let {
//     //   // permissions: [statusChanger],
//     //   // id: statusChangerId,
//     //   id,
//     //   email,
//     // } = payload;
//     // console.log("ID :", id, "Email :", email);
//     const schema = Joi.object({
//       table_name: Joi.string().required(),
//       fields: Joi.array().items(Joi.string()).required(),
//       sort: Joi.string().default("id"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
//       filter: Joi.object().keys({
//         startDate: Joi.date().iso().raw().allow(""),
//         endDate: Joi.date().iso().raw().allow(""),
//         dateField: Joi.string()
//           .valid("created_at", "createdAt", "updated_at", "updatedAt")
//           .allow(""),
//       }),
//       status: Joi.string().allow(""),
//       // .valid("pending", "rejected", "queried", "approved", "all")
//       // .default("all"),
//       selected_ids: Joi.alternatives(
//         Joi.string().allow("").default(""),
//         Joi.array().items(Joi.alternatives(Joi.string(), Joi.number()))
//       ).default(""),
//     }).unknown(true);

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res
//         .status(400)
//         .json({ error: true, message: error.details[0].message });
//     }

//     // Fetch referencing tables and field names
//     const foreignKeys = await knex("information_schema.key_column_usage")
//       .select(
//         "table_name as table_name",
//         "column_name as column_name",
//         "referenced_table_name as referenced_table_name",
//         "referenced_column_name as referenced_column_name"
//       )
//       .distinct()
//       .where("referenced_table_name", value.table_name);

//     const fieldNames = {};
//     const tables = [
//       value.table_name,
//       ...foreignKeys.map((key) => key.table_name),
//     ];
//     for (const table of tables) {
//       //
//       // // Fetch foreign key columns of the base table
//       // const foreignKeyColumns = await knex(
//       //   "information_schema.key_column_usage"
//       // )
//       //   .select(
//       //     "column_name as column_name",
//       //     "referenced_table_name as referenced_table_name"
//       //   )
//       //   .where("table_schema", "supplierx_dev")
//       //   .andWhere("table_name", table)
//       //   .whereNotNull("referenced_table_name");
//       // const foreignKeyFieldNames = foreignKeyColumns.map((key) => key);
//       // console.log(foreignKeyFieldNames);
//       // for (const fkfname of foreignKeyFieldNames) {
//       //   const referencingColumns = await knex("information_schema.columns")
//       //     .distinct("column_name as column_name")
//       //     .where("table_name", fkfname.referenced_table_name)
//       //     .orderBy("ordinal_position");
//       //   console.log("columns :", referencingColumns);
//       // }
//       //
//       const columns = await knex("information_schema.columns")
//         .distinct("column_name as column_name")
//         .where("table_name", table)
//         .orderBy("ordinal_position");
//       fieldNames[table] = columns.map((column) => column.column_name);
//     }

//     // Prepare fields with table names and aliased fields
//     const aliasedFields = [];
//     const fieldsWithTable = {};
//     for (const field of value.fields) {
//       for (const table of tables) {
//         if (fieldNames[table].includes(field)) {
//           const aliasedField = `${table}.${field}`;
//           aliasedFields.push(aliasedField);
//           fieldsWithTable[table] = fieldsWithTable[table] || [];
//           fieldsWithTable[table].push(field);
//           break;
//         }
//       }
//     }

//     const joinQuery = knex(value.table_name);
//     const relevantForeignKeys = foreignKeys.filter((key) =>
//       Object.keys(fieldsWithTable).includes(key.table_name)
//     );
//     relevantForeignKeys.forEach((key) => {
//       joinQuery.leftJoin(
//         key.table_name,
//         `${value.table_name}.${key.referenced_column_name}`,
//         `${key.table_name}.${key.column_name}`
//       );
//     });

//     if (value.filter) {
//       const { startDate, endDate, dateField } = value.filter;
//       if (startDate && endDate && dateField) {
//         const startDateISO = new Date(startDate).toISOString();
//         const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
//         const dateFields = [
//           "created_at",
//           "createdAt",
//           "updated_at",
//           "updatedAt",
//         ];
//         if (dateFields.includes(dateField)) {
//           joinQuery.whereBetween(`${value.table_name}.${dateField}`, [
//             startDateISO,
//             endDateISO,
//           ]);
//         }
//       }
//     }
//     if (value.selected_ids) {
//       joinQuery.whereIn(`${value.table_name}.id`, value.selected_ids);
//     }
//     if (value.status) {
//       joinQuery.where(`${value.table_name}.status`, value.status);
//     }
//     // id = `[${id}]`;
//     // const select = await knex("approvers2")
//     //   .select("department_id", "portal_code")
//     //   .whereRaw("JSON_CONTAINS(level_1_user_id, ?)", id);
//     // console.log(select);

//     // let supplierDetails = await knex("supplier_details")
//     //   .select("sap_code")
//     //   .where("emailID", email)
//     //   .first();
//     // console.log(supplierDetails);
//     // if (select.length > 0) {
//     //   const department_id = select[0].department_id;
//     //   const department = select[0].portal_code;
//     //   joinQuery.where({ department_id: department_id, department: department });
//     // }
//     let result = await joinQuery
//       .select(aliasedFields)
//       .orderBy(`${value.table_name}.${value.sort}`, value.order);

//     console.log(result.length);

//     result = await Promise.all(
//       result.map(async (row) => {
//         for (const key in row) {
//           const val = row[key];
//           const fileExtensions = [
//             "jpg",
//             "jfif",
//             "jpeg",
//             "png",
//             "gif",
//             "bmp",
//             "svg",
//             "webp",
//             "pdf",
//           ];
//           const fileExtensionsPattern = new RegExp(
//             `\.(${fileExtensions.join("|")})$`,
//             "i"
//           );
//           if (
//             typeof val === "string" &&
//             fileExtensionsPattern.test(val.toLocaleLowerCase())
//           ) {
//             const img = await (value.table_name === "asns"
//               ? s3.getASNTempUrl(val)
//               : s3.getTempUrl(val));
//             row[key] = img;
//           }
//         }
//         return row;
//       })
//     );

//     return result;
//     // return res.json({
//     //   error: false,
//     //   message: "Data fetched successfully",
//     //   result,
//     // });
//   } catch (error) {
//     return res.status(500).json({
//       error: true,
//       message: "Something went wrong",
//       data: error.message,
//     });
//   }
// };

/// field object code

const fetchData = async (req, res) => {
  console.log("In Fetch Data");
  try {
    const accessToken = req.headers.authorization;

    // Decode the access token and fetch department
    const access = await functions.decodeAccessToken(accessToken);

    const { error, value } = validation.fetchData(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });
    }
    // Fetch referencing tables and field names
    const foreignKeys = await knex("information_schema.key_column_usage")
      .select(
        "table_name as table_name",
        "column_name as column_name",
        "referenced_table_name as referenced_table_name",
        "referenced_column_name as referenced_column_name"
      )
      .distinct()
      .where("referenced_table_name", value.table_name);

    const fieldNames = {};
    let getData = [];
    const tables = [
      value.table_name,
      ...foreignKeys.map((key) => key.table_name),
    ];
    for (const table of tables) {
      const tableData = await functions.getDataByID(table);
      getData.push(...tableData);
      const columns = await knex("information_schema.columns")
        .distinct("column_name as column_name")
        .where("table_name", table)
        .orderBy("ordinal_position");
      fieldNames[table] = columns.map((column) => column.column_name);
    }

    // Prepare fields with table names and aliased fields
    const aliasedFields = [];
    const fieldsWithTable = {};
    for (const [fieldName, description] of Object.entries(value.fields)) {
      for (const table of tables) {
        if (fieldNames[table].includes(fieldName)) {
          const aliasedField = `${table}.${fieldName}`;
          aliasedFields.push(aliasedField);
          fieldsWithTable[table] = fieldsWithTable[table] || [];
          fieldsWithTable[table].push(fieldName);
          break;
        }
      }
    }
    const joinQuery = knex(value.table_name);
    const tableAliases = {};

    // Function to generate a unique alias for a table
    const generateAlias = (tableName) => {
      if (!tableAliases[tableName]) {
        tableAliases[tableName] = 1;
      } else {
        tableAliases[tableName]++;
      }
      return `${tableName}${tableAliases[tableName]}`;
    };
    const relevantForeignKeys = foreignKeys.filter((key) =>
      Object.keys(fieldsWithTable).includes(key.table_name)
    );
    const relevant = getData.filter((keys) =>
      Object.keys(fieldsWithTable).includes(keys.table_name)
    );
    relevantForeignKeys.forEach((key) => {
      joinQuery.leftJoin(
        key.table_name,
        `${value.table_name}.${key.referenced_column_name}`,
        `${key.table_name}.${key.column_name}`
      );
    });
    // Iterate over the relevant foreign keys and perform left joins
    relevant.forEach(async (key) => {
      const referencedTableAlias = generateAlias(key.referenced_table_name);
      joinQuery
        .leftJoin(
          `${key.referenced_table_name} AS ${referencedTableAlias}`,
          `${referencedTableAlias}.${key.referenced_column_name}`,
          `${key.table_name}.${key.column_name}`
        )
        .select(
          `${referencedTableAlias}.${key.column_to_select} AS ${key.column_name}`
        );
      aliasedFields.push(
        `${referencedTableAlias}.${key.column_to_select} AS ${key.column_name}`
      );
    });

    if (value.filter) {
      const { startDate, endDate, dateField } = value.filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        // const dateFields = [
        //   "created_at",
        //   "createdAt",
        //   "updated_at",
        //   "updatedAt",
        // ];
        // if (dateFields.includes(dateField)) {
        joinQuery.whereBetween(`${value.table_name}.${dateField}`, [
          startDateISO,
          endDateISO,
        ]);
        // }
      }
    }
    if (value.selected_ids.length > 0) {
      joinQuery.whereIn(`${value.table_name}.id`, value.selected_ids);
    }
    if (value.status !== undefined && value.status !== "") {
      joinQuery.where(`${value.table_name}.status`, value.status);
    }
    if (
      value.table_name === "supplier_details" &&
      access.department !== undefined &&
      access.department !== null &&
      access.department_id !== undefined &&
      access.department_id !== null
    ) {
      joinQuery.where({ department: access.department });
    }
    if (value.table_name === "asns" && access.sap_code) {
      if (!value.dropdown) {
        value.dropdown = "supplier";
      }
      console.log(value.dropdown);
      if (value.dropdown === "supplier") {
        joinQuery.where("supplierId", access.sap_code);
      } else {
        console.log("here");
        joinQuery.whereNot("asns.status", "cancelled");
      }
    }
    if (value.type) {
      const typeMapping = {
        ASN: "NB",
        SCR: "ZSER",
      };
      const mappedType = typeMapping[value.type];

      if (mappedType) {
        joinQuery.where("type", mappedType);
      }
    }
    let result = await joinQuery
      .select(aliasedFields)
      .orderBy(`${value.table_name}.${value.sort}`, value.order);
    console.log(result.length);
    result = await Promise.all(
      result.map(async (row) => {
        const formattedRow = {};
        for (const [fieldName, description] of Object.entries(value.fields)) {
          for (const key in row) {
            const val = row[key];

            const fileExtensions = [
              "jpg",
              "jfif",
              "jpeg",
              "png",
              "gif",
              "bmp",
              "svg",
              "webp",
              "pdf",
            ];
            const fileExtensionsPattern = new RegExp(
              `\.(${fileExtensions.join("|")})$`,
              "i"
            );
            if (
              typeof val === "string" &&
              fileExtensionsPattern.test(val.toLocaleLowerCase())
            ) {
              const img = await (value.table_name === "asns"
                ? s3.getASNTempUrl(val)
                : s3.getTempUrl(val));
              row[key] = img;
            }
          }
          formattedRow[description] = row[fieldName];
        }
        return formattedRow;
      })
    );

    return result;
    // return res.json({
    //   error: false,
    //   message: "Data fetched successfully",
    //   result,
    // });
  } catch (error) {
    throw error;
    //   return res.status(500).json({
    //     error: true,
    //     message: "Something went wrong",
    //     data: error.message,
    //   });
  }
};

export default { fetchFields, fetchData, excelExport, generateExcelContent };
