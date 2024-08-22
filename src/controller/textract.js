import textract from "../services/textract.js";
import constant from "../helpers/constants.js";
import Joi from "joi";
// import functions from "../../helpers/functions.js";
import { PDFDocument } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";
import knex from "../config/mysql_db.js";
import moment from "moment";
import { response } from "express";
import AWS from "aws-sdk";
import validation from "../validation/textract.js";
// import pdfParse from "pdf-parse";

const supplierId = 1;
const Textract = async (req, res) => {
  // try {
  if (!req.files) {
    return res.status(400).json({
      error: true,
      message: "Please upload a file",
    });
  }

  const invoice = {
    invoiceName: "",
    invoiceId: "",
    s3Name: "",
    s3Path: "",
    textractResponse: "",
    s3Namepdf: "",
  };

  const checkLenght = req.files.file.length;
  if (checkLenght == undefined) {
    const { error, value } = validation.textract({
      size: req.files.file.size,
      mimetype: req.files.file.mimetype,
    });
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const originalFileName = req.files.file.name;
    const UniqueId = uuidv4();
    const modifiedName = UniqueId + originalFileName;

    let response = {};
    let temp = [];
    if (req.files.file.mimetype == "application/pdf") {
      const buffer = Buffer.from(req.files.file.data);
      const pdfDoc = await PDFDocument.load(req.files.file.data);
      const numPages = pdfDoc.getPageCount();
      const uploadParams = {
        Bucket: constant.bucket + "/tax-invoices",
        Key: `${modifiedName}`,
        Body: buffer,
        ContentType: req.files.file.mimetype,
      };

      const resp = await textract.uploadToS3(uploadParams);
      if (resp.error === true) {
        return res.status(500).json({
          error: resp.error,
          message: "Failed to upload",
          data: resp.data,
        });
      }
      const index = resp.data.lastIndexOf("/");
      const path = resp.data.substring(0, index);
      const currentDateIST = Date.now();

      const pdfBytes = Buffer.from(req.files.file.data);

      // pdfDoc.
      const pageBuffers = [];
      const pdfPagesName = [];
      if (numPages > 1) {
        for (let i = 0; i < numPages; i++) {
          const subDocument = await PDFDocument.create();
          // copy the page at current index
          const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
          subDocument.addPage(copiedPage);
          const pdfBytes = await subDocument.save();
          // console.log(pdfBytes,"this is pdf bytes")
          pdfPagesName.push(`${i}${modifiedName}`);
          const buffer = Buffer.from(pdfBytes);
          const name = modifiedName;
          const uploadParams = {
            Bucket: constant.bucket + "/tax-invoices",
            Key: `${i}${modifiedName}`,
            Body: buffer,
            ContentType: req.files.file.mimetype,
          };

          const resp = await textract.uploadToS3(uploadParams);
          if (resp.error === true) {
            return res.json({
              error: resp.error,
              message: "Failed to upload",
              data: resp.data,
            });
          }
          const result = await textract.Textract2(
            `${i}${modifiedName}`,
            "tax-invoices/"
          );
          temp.push(result);
        }

        (invoice.invoiceId = UniqueId),
          (invoice.invoiceName = originalFileName),
          (invoice.s3Name = modifiedName),
          (invoice.s3Path = path),
          (invoice.textractResponse = {
            data: temp,
          });
      } else {
        const result = await textract.Textract2(
          `${modifiedName}`,
          "tax-invoices/"
        );
        temp.push(result);
      }

      let obj = {};
      let tempHeader = [];
      let tempRows = [];
      temp.forEach((elment) => {
        const temp = obj;
        obj = {};
        obj = { ...temp, ...elment.data.data };
        elment.data.headers.forEach((header) => {
          tempHeader.push(header);
        });
        elment.data.rows.forEach((row) => {
          tempRows.push(row);
        });
      });
      response.error = false;
      response.data = obj;
      response.headers = tempHeader;
      response.rows = tempRows;
      (invoice.invoiceId = UniqueId),
        (invoice.invoiceName = originalFileName),
        (invoice.s3Name = modifiedName),
        (invoice.s3Path = path),
        (invoice.textractResponse = {
          data: obj,
          headers: tempHeader,
          rows: tempRows,
        });
    } else {
      const uploadParams = {
        Bucket: constant.bucket + "/tax-invoices",
        Key: modifiedName,
        Body: Buffer.from(req.files.file.data),
        ContentType: req.files.file.mimetype,
      };

      const resp = await textract.uploadToS3(uploadParams);
      if (resp.error === true) {
        return res.json({
          error: resp.error,
          message: "Failed to upload",
          data: resp.data,
        });
      }

      const index = resp.data.lastIndexOf("/");
      const path = resp.data.substring(0, index);
      response = await textract.Textract2(modifiedName, "tax-invoices/");
      const head = response.data.headers;
      const rows = response.data.rows;
      const err = response.data.error;

      invoice.invoiceId = UniqueId;
      invoice.invoiceName = originalFileName;
      invoice.s3Name = modifiedName;
      invoice.s3Path = path;
      invoice.textractResponse = {
        data: response.data.data,
        headers: head,
        rows: rows,
      };

      response.error = err;
      response.data = response.data.data;
      response.headers = head;
      response.rows = rows;
    }
    // const response2 = await textract.Textract2(modifiedName)

    if (response.error === true) {
      return res.json({
        error: response.data.error,
        message: "Upload again",
        // data:.data,
        // data: response.data.data,
      });
    }

    // if (response.data) {
    //   ////storing data on success toLowerCase() dynamodb///////////

    //   const tableName = "invoices";
    //   response.data.id = uuidv4();
    //   response.data.supplier_id = supplierId;
    //   response.data.created_at = new Date() + "";
    //   response.data.table = response.data.table;
    //   const insertParams = {
    //     TableName: tableName,
    //     Item: response.data,
    //   };
    //   const result = await functions.insertData(insertParams);
    //   if (!result) {
    //     return {
    //       error: true,
    //       message: "Inserting Invoice in the database failed",
    //     };
    //   }
    // }
    // ////inserting in dynamo db - over ////////////////////////

    // const sup_id = response.data.supplier_id;
    // delete response.data.supplier_id;
    // delete response.data.table;
    // delete response.data.id;
    function calculateMatchPercentage(obj1, obj2) {
      const dataMatchPercentage = compareData(obj1.data, obj2.data);
      const headersMatchPercentage = compareHeaders(obj1.headers, obj2.headers);
      const rowsMatchPercentage = compareRows(obj1.rows, obj2.rows);

      // Calculate the overall match percentage as the average of the three
      const overallMatchPercentage =
        (dataMatchPercentage + headersMatchPercentage + rowsMatchPercentage) /
        3;

      return {
        dataMatchPercentage,
        headersMatchPercentage,
        rowsMatchPercentage,
        overallMatchPercentage,
      };
    }

    // Compare 'data' objects (key-value pairs)
    function compareData(data1, data2) {
      const totalKeys = Object.keys(data1).length;
      let matchingKeys = 0;

      for (let key in data1) {
        if (data2.hasOwnProperty(key) && data1[key] === data2[key]) {
          matchingKeys++;
        }
      }

      return totalKeys ? (matchingKeys / totalKeys) * 100 : 100; // Handle case where there are no keys
    }

    // Compare 'headers' arrays
    function compareHeaders(headers1, headers2) {
      // Flatten headers arrays to a single list
      const flatHeaders1 = headers1.flat();
      const flatHeaders2 = headers2.flat();

      const totalHeaders = flatHeaders1.length;
      let matchingHeaders = 0;

      // Compare each header in order
      for (let i = 0; i < totalHeaders; i++) {
        if (flatHeaders1[i] === flatHeaders2[i]) {
          matchingHeaders++;
        }
      }

      return totalHeaders ? (matchingHeaders / totalHeaders) * 100 : 100;
    }

    // Compare 'rows' arrays
    function compareRows(rows1, rows2) {
      const totalRows = rows1.length;
      let matchingRows = 0;

      // Compare each row group
      for (let i = 0; i < totalRows; i++) {
        const rowGroup1 = rows1[i];
        const rowGroup2 = rows2[i];

        if (compareRowGroup(rowGroup1, rowGroup2)) {
          matchingRows++;
        }
      }

      return totalRows ? (matchingRows / totalRows) * 100 : 100;
    }

    // Helper function to compare individual row groups
    function compareRowGroup(rowGroup1, rowGroup2) {
      if (!rowGroup1 || !rowGroup2 || rowGroup1.length !== rowGroup2.length) {
        return false;
      }

      // Compare each row within the group
      for (let i = 0; i < rowGroup1.length; i++) {
        const row1 = rowGroup1[i];
        const row2 = rowGroup2[i];

        if (!compareRow(row1, row2)) {
          return false;
        }
      }

      return true;
    }

    // Helper function to compare individual rows
    function compareRow(row1, row2) {
      if (!row1 || !row2 || row1.length !== row2.length) {
        return false;
      }

      // Compare each element within the row
      for (let i = 0; i < row1.length; i++) {
        if (row1[i] !== row2[i]) {
          return false;
        }
      }

      return true;
    }

    const getData = await knex("invoices");
    let matching = {
      invoice: "",
      data: "",
      header: "",
      rows: "",
      overall: "",
    };
    for (const element of getData) {
      const data2 = element.textractResponse
        ? JSON.parse(element.textractResponse)
        : null;
      if (data2 == null) {
        continue;
      }
      const result = calculateMatchPercentage(response, data2);
      const {
        dataMatchPercentage,
        headersMatchPercentage,
        rowsMatchPercentage,
        overallMatchPercentage,
      } = result;
      if (matching.data < dataMatchPercentage) {
        matching.invoice = element;
        matching.data = dataMatchPercentage;
        (matching.header = headersMatchPercentage),
          (matching.rows = rowsMatchPercentage),
          (matching.overall = overallMatchPercentage);
      }
    }

    return res.json({
      error: response.error ? response.error : false,
      message: "Invoice scanned successfully",
      // mapStatus:mapping,
      // supplierId: sup_id,
      data: response.data,
      headers: response.headers,
      rows: response.rows,
      percentage: {
        filepath: matching.invoice.s3Path + matching.invoice.s3Name,
        data: matching.data,
        header: matching.header,
        rows: matching.rows,
        overall: matching.overall,
      },
      invoice,
    });
  } else {
    // const data = [];
    // const data2 = await Promise.all(
    //   req.files.file.map(async (file) => {
    //     const schema = Joi.object({
    //       size: Joi.number()
    //         .max(50 * 1024 * 1024)
    //         .required(),
    //       mimetype: Joi.string()
    //         .valid("image/png", "image/jpeg", "image/jpg", "application/pdf")
    //         .required(),
    //     });

    //     const { error, value } = schema.validate({
    //       size: file.size,
    //       mimetype: file.mimetype,
    //     });
    //     if (error) {
    //       return res.json({
    //         error: true,
    //         message: error.details[0].message,
    //       });
    //     }

    //     const supplierId = req.body.supplierId;

    //     const originalFileName = file.name;
    //     const UniqueId = uuidv4();
    //     const modifiedName = UniqueId + originalFileName;
    //     let response = {};
    //     if (file.mimetype == "application/pdf") {
    //       let temp = [];
    //       const buffer = Buffer.from(file.data);
    //       const pdfDoc = await PDFDocument.load(file.data);
    //       const numPages = pdfDoc.getPageCount();
    //       const uploadParams = {
    //         Bucket: constant.bucket + "/tax-invoices",
    //         Key: `${modifiedName}`,
    //         Body: buffer,
    //         ContentType: file.mimetype,
    //       };
    //       const resp = await textract.uploadToS3(uploadParams);
    //       if (resp.error === true) {
    //         return res.json({
    //           error: resp.error,
    //           message: "Failed to upload",
    //           data: resp.data,
    //         });
    //       }
    //       const index = resp.data.lastIndexOf("/");
    //       const path = resp.data.substring(0, index);
    //       const currentDateIST = moment
    //         .tz("Asia/Kolkata")
    //         .format("YYYY-MM-DD HH:mm:ss");
    //       const insertName = await knex("invoices").insert({
    //         supplierId: supplierId,
    //         invoiceName: originalFileName,
    //         invoiceId: UniqueId,
    //         s3Name: modifiedName,
    //         s3Path: path,
    //         createdAt: currentDateIST,
    //         updatedAt: currentDateIST,
    //       });

    //       const pdfPagesName = [];
    //       if (numPages > 1) {
    //         for (let i = 0; i < numPages; i++) {
    //           const subDocument = await PDFDocument.create();
    //           // copy the page at current index
    //           const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
    //           subDocument.addPage(copiedPage);
    //           const pdfBytes = await subDocument.save();
    //           // console.log(pdfBytes,"this is pdf bytes")
    //           pdfPagesName.push(`${i}${modifiedName}`);
    //           const buffer = Buffer.from(pdfBytes);
    //           const name = modifiedName;
    //           const uploadParams = {
    //             Bucket: constant.bucket + "/tax-invoices",
    //             Key: `${i}${modifiedName}`,
    //             Body: buffer,
    //             ContentType: file.mimetype,
    //           };

    //           const resp = await textract.uploadToS3(uploadParams);
    //           if (resp.error === true) {
    //             return res.json({
    //               error: resp.error,
    //               message: "Failed to upload",
    //               data: resp.data,
    //             });
    //           }
    //           const result = await textract.Textract2(`${i}${modifiedName}`);
    //           temp.push(result);
    //         }
    //       } else {
    //         const result = await textract.Textract2(`${modifiedName}`);
    //         temp.push(result);
    //       }

    //       let obj = {};
    //       let tempHeader = [];
    //       let tempRows = [];
    //       temp.forEach((elment) => {
    //         const temp = obj;
    //         obj = {};
    //         obj = { ...temp, ...elment.data.data };
    //         elment.data.headers.forEach((header) => {
    //           tempHeader.push(header);
    //         });
    //         elment.data.rows.forEach((row) => {
    //           tempRows.push(row);
    //         });
    //       });
    //       response.error = false;
    //       response.data = obj;
    //       response.headers = tempHeader;
    //       response.rows = tempRows;
    //       const updateResponse = await knex("invoices")
    //         .update({
    //           s3Namepdf: JSON.stringify(pdfPagesName),
    //           textractResponse: JSON.stringify(response),
    //           updatedAt: currentDateIST,
    //         })
    //         .where("invoiceId", UniqueId);
    //       // data.push(response)
    //       return response;
    //     } else {
    //       const uploadParams = {
    //         Bucket: constant.bucket + "/tax-invoices",
    //         Key: modifiedName,
    //         Body: Buffer.from(file.data),
    //         ContentType: file.mimetype,
    //       };

    //       const resp = await textract.uploadToS3(uploadParams);
    //       if (resp.error === true) {
    //         return res.json({
    //           error: resp.error,
    //           message: "Failed to upload",
    //           data: resp.data,
    //         });
    //       }

    //       const index = resp.data.lastIndexOf("/");
    //       const path = resp.data.substring(0, index);
    //       response = await textract.Textract2(modifiedName);
    //       const head = response.data.headers;
    //       const rows = response.data.rows;
    //       const err = response.data.error;
    //       // response.error = err;
    //       response.data = response.data.data;
    //       response.headers = head;
    //       response.rows = rows;
    //       const currentDateIST = moment
    //         .tz("Asia/Kolkata")
    //         .format("YYYY-MM-DD HH:mm:ss");
    //       const insertIntoDb = await knex("invoices").insert({
    //         invoiceName: originalFileName,
    //         invoiceId: UniqueId,
    //         s3Name: modifiedName,
    //         s3Path: path,
    //         textractResponse: JSON.stringify(response),
    //         supplierId: supplierId,
    //         createdAt: currentDateIST,
    //         updatedAt: currentDateIST,
    //       });
    //       return response;
    //     }
    //     // data.push(response)
    //   })
    // );
    // console.log(data2,"this is data")
    //   const map = await functions.mapping(data2)
    return res.json({
      error: true,
      message: "Please upload only one file",
      data: data2,
    });
  }
  // } catch (error) {
  //   return res.json({
  //     error: true,
  //     message: error.message,
  //     data: "error here.",
  //   });
  // }
};
// const translate = new AWS.Translate();
 // Replace 'your-region' with your AWS region

// const uploadAndTranslate = async (req, res) => {
//   try {
//     const fileType = req.files.file.mimetype;
//     const fileBuffer = req.files.file.data;
//     let extractedText = "";

//     if (fileType === "application/pdf") {
//       // Convert PDF to text
//       extractedText = await extractTextFromPDF(fileBuffer); // Await extractTextFromPDF result
//     } else if (fileType.startsWith("image/")) {
//       // Convert Image to text using OCR
//       const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng');
//       extractedText = text; // No need to convert to UTF-8 again
//     } else {
//       return res.status(400).send("Unsupported file type");
//     }

//     // Translate the extracted UTF-8 text using AWS Translate
//     const translateParams = {
//       SourceLanguageCode: "auto", // Auto-detect source language
//       TargetLanguageCode: "en", // Replace with target language code
//       Text: extractedText,
//     };

//     const translateResponse = await translate.translateText(translateParams).promise();
//     const translatedText = translateResponse.TranslatedText;

//     return res.json({
//       error: false,
//       message: "Translated Text",
//       data: translatedText,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).send("Error processing the file");
//   }
// };
export default {
  Textract,
  // uploadAndTranslate
};
