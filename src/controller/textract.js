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

const Textract = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({
        error: true,
        message: "Please upload a file",
      });
    }

    if (!req.body.supplierId) {
      return res.status(400).json({
        error: true,
        message: "Please give SupplierId",
      });
    }

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

      const supplierId = req.body.supplierId;

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
        const currentDateIST = moment
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss");
        const insertName = await knex("invoices_textract").insert({
          supplierId: supplierId,
          invoiceName: originalFileName,
          invoiceId: UniqueId,
          s3Name: modifiedName,
          s3Path: path,
          createdAt: currentDateIST,
          updatedAt: currentDateIST,
        });
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

        const getRecord = await knex("invoices_textract")
          .where("invoiceId", UniqueId)
          .select("id")
          .first();

        // const updationDataIs = await functions.takeSnapShot("invoiceId",getRecord.id);

        const updateResponse = await knex("invoices_textract")
          .update({
            s3Namepdf: JSON.stringify(pdfPagesName),
            textractResponse: JSON.stringify(response),
            updatedAt: currentDateIST,
          })
          .where("invoiceId", UniqueId);
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
        response.error = err;
        response.data = response.data.data;
        response.headers = head;
        response.rows = rows;
        const currentDateIST = moment
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss");
        const insertIntoDb = await knex("invoices_textract").insert({
          invoiceName: originalFileName,
          invoiceId: UniqueId,
          s3Name: modifiedName,
          s3Path: path,
          textractResponse: JSON.stringify(response),
          supplierId: supplierId,
          createdAt: currentDateIST,
          updatedAt: currentDateIST,
        });
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

      if (response.data) {
        ////storing data on success toLowerCase() dynamodb///////////

        const tableName = "invoices";
        response.data.id = uuidv4();
        response.data.supplier_id = supplierId;
        response.data.created_at = new Date() + "";
        response.data.table = response.data.table;
        const insertParams = {
          TableName: tableName,
          Item: response.data,
        };
        const result = await functions.insertData(insertParams);
        if (!result) {
          return {
            error: true,
            message: "Inserting Invoice in the database failed",
          };
        }
      }
      ////inserting in dynamo db - over ////////////////////////

      const sup_id = response.data.supplier_id;
      delete response.data.supplier_id;
      delete response.data.table;
      delete response.data.id;

      return res.json({
        error: response.error ? response.error : false,
        message: "Invoice successfully added to Database",
        // mapStatus:mapping,
        supplierId: sup_id,
        data: response.data,
        headers: response.headers,
        rows: response.rows,
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
      //       const insertName = await knex("invoices_textract").insert({
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
      //       const updateResponse = await knex("invoices_textract")
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
      //       const insertIntoDb = await knex("invoices_textract").insert({
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
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
      data: "error here.",
    });
  }
};

const forMapping = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({
        error: true,
        message: "Please upload a file",
      });
    }

    const checkLenght = req.files.file.length;
    if (checkLenght == undefined) {
      const { error, value } = validation.forMapping({
        size: req.files.file.size,
        mimetype: req.files.file.mimetype,
      });
      if (error) {
        return res.json({
          error: true,
          message: error.details[0].message,
        });
      }

      // const supplierId = req.body.supplierId;

      const originalFileName = req.files.file.name;
      const UniqueId = uuidv4();
      const modifiedName = UniqueId + originalFileName;
      const fileBuffer = Buffer.from(req.files.file.data);
      const getFileHash = functions.generateFileHash(fileBuffer);
      // const checkInDb = await knex('field_mapping').where({
      //   file_hash:getFileHash,
      // })

      // if(checkInDb.length > 0){
      //   if(checkInDb[0].mapped =='1'){
      //     return res.json({
      //       error: true,
      //       message: "Invoice is already mapped",
      //     });
      //   }
      //   return res.json({
      //     error: false,
      //     message:"Invoice read successfully",
      //     data: { id: checkInDb[0].mapId, extractedKeys: JSON.parse(checkInDb[0].extractedKeys), sapKeys: JSON.parse(checkInDb[0].sapKeys) },
      //   })
      // }

      let response = {};
      let temp = [];
      if (req.files.file.mimetype == "application/pdf") {
        const buffer = Buffer.from(req.files.file.data);
        const pdfDoc = await PDFDocument.load(req.files.file.data);
        const numPages = pdfDoc.getPageCount();
        const uploadParams = {
          Bucket: constant.bucket + "/invoice-mapping",
          Key: `${modifiedName}`,
          Body: buffer,
          ContentType: req.files.file.mimetype,
        };

        const resp = await textract.uploadToS3(uploadParams);
        // console.log(resp);
        if (resp.error === true) {
          return res.json({
            error: resp.error,
            message: "Failed to upload",
            data: resp.data,
          });
        }
        const index = resp.data.lastIndexOf("/");
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
              Bucket: constant.bucket + "/invoice-mapping",
              Key: `${i}${modifiedName}`,
              Body: buffer,
              ContentType: req.files.file.mimetype,
            };

            const resp = await textract.uploadToS3(uploadParams);
            console.log(resp, "this is inside");
            if (resp.error === true) {
              return res.json({
                error: resp.error,
                message: "Failed to upload",
                data: resp.data,
              });
            }
            const result = await textract.Textract2(
              `${i}${modifiedName}`,
              "invoice-mapping/"
            );
            temp.push(result);
          }
        } else {
          console.log(modifiedName);
          const result = await textract.Textract2(
            `${modifiedName}`,
            "invoice-mapping/"
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
      } else {
        const uploadParams = {
          Bucket: constant.bucket + "/invoice-mapping",
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
        response = await textract.Textract2(modifiedName, "invoice-mapping/");
        const head = response.data.headers;
        const rows = response.data.rows;
        const err = response.data.error;
        response.error = err;
        response.data = response.data.data;
        response.headers = head;
        response.rows = rows;
      }

      if (response.error === true) {
        return res.json({
          error: response.data.error,
          message: "Upload again",
          // data:.data,
          // data: response.data.data,
        });
      }

      const extractedKeys = [];
      const extractedKey = Object.keys(response.data);
      const resp = response.data;
      for (const iterator of extractedKey) {
        extractedKeys.push(`${iterator}${resp[iterator]}`);
      }
      const getSapInvoice = await knex("form_field_configuration")
        .select("fields")
        .where("moduleName", "=", "sapInvoice");

      if (getSapInvoice.length <= 0) {
        return {
          error: true,
        };
      }

      let sapInvoice = JSON.parse(getSapInvoice[0].fields);
      sapInvoice = sapInvoice[0];

      const headerKeys = sapInvoice.header.map((item) => item.key);
      const itemKeys = sapInvoice.Items.map((item) => item.key);

      const currentDateIST = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");

      const id = uuidv4();

      // const getFieldMappings = await knex("field_mapping").select("*").where({mapped:'0'}).whereNotNull('mappedKeys');

      // for (const mapping of getFieldMappings) {
      //   const extractedKeysString = mapping.extractedKeys;
      //   const extractedKeysDB = JSON.parse(extractedKeysString);
      //   const allMatched = extractedKeysDB.every((key) =>
      //     extractedKeys.includes(key)
      //   );

      //   if (allMatched) {
      //     return res.json({
      //       error: true,
      //       message: "This invoice format is already mapped",
      //     });
      //   }
      // }

      const insertIntoDb = await knex("field_mapping").insert({
        mapId: id,
        extractedKeys: JSON.stringify(extractedKey),
        extractedKeyValue: JSON.stringify(extractedKeys),
        sapKeys: JSON.stringify(headerKeys),
        mapped: "0",
        file_hash: getFileHash,
        file_data: fileBuffer,
        createdAt: currentDateIST,
        updatedAt: currentDateIST,
      });

      if (insertIntoDb < 0) {
        return res.json({
          error: true,
          message: "Failed to insert into database",
        });
      }

      return res.json({
        error: false,
        message: "Invoice read successfully",
        data: { id: id, extractedKeys: resp, sapKeys: headerKeys },
      });
    } else {
      return res.json({
        error: true,
        message: "Please upload only one file",
      });
    }
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
      data: "error here.",
    });
  }
};

const mapping = async (req, res) => {
  try {
    const { error, value } = validation.mapping(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, mappedKeys } = value;

    const obj = {};
    const patternKeys = [];
    for (const iterator of mappedKeys) {
      obj[iterator.sapKey] = iterator.extractedKey;
      patternKeys.push(iterator.extractedKey);
    }
    // const updationDataIs = await functions.takeSnapShot("field_mapping",id);
    const update = await knex("field_mapping")
      .update({
        mapped: "1",
        mappedKeys: JSON.stringify(obj),
        patternKeys: JSON.stringify(patternKeys),
        updatedAt: moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      })
      .where("mapId", id);

    if (update < 0) {
      return res.json({
        error: true,
        message: "Failed to update",
      });
    }

    // if (id) {
    //   const modifiedByTable1 = await functions.SetModifiedBy(
    //     req.headers["authorization"],
    //     "field_mapping",
    //     "id",
    //     id
    //   );
    //   console.log("isUpdated:-", modifiedByTable1);
    // }
    return res.json({
      error: false,
      message: "Mapped Keys Stored successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
      data: JSON.stringify(error),
    });
  }
};

const automateInvoice = async (req, res) => {
  try {
    const { error, value } = validation.automateInvoice(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { invoiceName } = value;
    const lastIndex = invoiceName.lastIndexOf(".");
    const extension = invoiceName.substr(lastIndex + 1);

    let response = [];
    let responseData = {};
    if (extension == "pdf") {
      const getPdf = await knex("invoices_textract")
        .select("s3Name", "s3Namepdf")
        .where("s3Name", invoiceName);
      if (getPdf.length <= 0) {
        return res.json({
          error: true,
          message: "Please upload document",
          data: getPdf,
        });
      }
      const pdfPagesName = JSON.parse(getPdf[0].s3Namepdf);
      const pdfPages = pdfPagesName.length;
      if (pdfPages <= 0) {
        response = await textract.Textract2(invoiceName, "tax-invoices/");
        // responseData.error = response.data.error;
        responseData.data = response.data.data;
        responseData.headers = response.data.headers;
        responseData.rows = response.data.rows;
      } else {
        for (let i = 0; i < pdfPages; i++) {
          const temp = await textract.Textract2(
            pdfPagesName[i],
            "tax-invoices/"
          );
          response.push(temp);
        }
        let obj = {};
        let tempHeader = [];
        let tempRows = [];
        response.forEach((elment) => {
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
        // responseData.error = false;
        responseData.data = obj;
        responseData.headers = tempHeader;
        responseData.rows = tempRows;
      }
    } else {
      response = await textract.Textract2(invoiceName, "tax-invoices/");
      responseData.data = response.data.data;
      responseData.headers = response.data.headers;
      responseData.rows = response.data.rows;
    }

    // const time = await functions.getTime()
    const mapped = await functions.sapMapping(responseData);
    if (mapped.error === true) {
      return res.json({
        error: false,
        message: "Invoice fetched successfully",
        sapKey: mapped.data,
        sapItems: mapped.items,
        data: responseData.data,
        headers: responseData.headers,
        rows: responseData.rows,
      });
    }
    const uniqId = uuidv4();
    return res.json({
      error: false,
      message: "Invoice fetched successfully",
      sapData: { uniqId, header: { ...mapped.data }, Items: [...mapped.items] },
      data: responseData.data,
      headers: responseData.headers,
      rows: responseData.rows,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
      data: JSON.stringify(error),
    });
  }
};

//this is working
const automateInvoice2 = async (req, res) => {
  // try {
  const { error, value } = validation.automateInvoice2(req.body);
  if (error) {
    return res.json({
      error: true,
      message: error.details[0].message,
    });
  }
  const { invoiceName } = value;
  const sapData = [];
  const textExtracted = [];
  const invoiceNotInDb = [];
  for (const invoice of invoiceName) {
    const lastIndex = invoice.lastIndexOf(".");
    const extension = invoice.substr(lastIndex + 1);
    const getName = await knex("invoices_textract")
      .select("invoiceName", "poNo")
      .whereNotNull("poNo")
      .where("s3Name", invoice);
    if (getName.length <= 0) {
      invoiceNotInDb.push(invoice);
      continue;
    }
    let response = [];
    let responseData = {};
    if (extension == "pdf") {
      const getPdf = await knex("invoices_textract")
        .select("s3Name", "s3Namepdf", "invoiceName")
        .where("s3Name", invoice);
      if (getPdf.length <= 0) {
        return res.json({
          error: true,
          message: "Please upload document",
          data: getPdf,
        });
      }
      const pdfPagesName = JSON.parse(getPdf[0].s3Namepdf);
      const pdfPages = pdfPagesName.length;
      if (pdfPages <= 0) {
        response = await textract.Textract2(invoice, "tax-invoices/");
        // responseData.error = response.data.error;
        responseData.data = response.data.data;
        responseData.headers = response.data.headers;
        responseData.rows = response.data.rows;
      } else {
        for (let i = 0; i < pdfPages; i++) {
          const temp = await textract.Textract2(
            pdfPagesName[i],
            "tax-invoices/"
          );
          response.push(temp);
        }
        let obj = {};
        let tempHeader = [];
        let tempRows = [];
        response.forEach((elment) => {
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
        // responseData.error = false;
        responseData.data = obj;
        responseData.headers = tempHeader;
        responseData.rows = tempRows;
      }
    } else {
      response = await textract.Textract2(invoice, "tax-invoices/");
      responseData.data = response.data.data;
      responseData.headers = response.data.headers;
      responseData.rows = response.data.rows;
    }

    textExtracted.push(responseData.data);
    const dataObject = responseData.data;

    let counter2 = 0;

    const array = ["gst", "pan", "irn", "invoice"];

    async function checkInvoiceKeys(obj) {
      const Keys = Object.keys(obj);
      Keys.map((key, index) => {
        for (const iterator of array) {
          key.toLowerCase().includes(iterator.toLowerCase())
            ? counter2++
            : counter2;
          // console.log(counter2)
        }
      });
    }

    await checkInvoiceKeys(dataObject);

    if (counter2 == 0) {
      return res.json({
        error: true,
        message: "This invoice format is not valid",
      });
    }

    function getGSTKeyIndexesAndValues(obj) {
      const keys = Object.keys(obj);
      const gstKeysAndValues = keys
        .map((key, index) =>
          key.toLowerCase().includes("gst")
            ? { key, value: obj[key], index }
            : null
        )
        .filter((item) => item !== null);

      return gstKeysAndValues;
    }
    const result = getGSTKeyIndexesAndValues(dataObject);
    console.log(result);
    let counter = 0;
    for (const iterator of result) {
      const getGST = dataObject[iterator.key];
      console.log(getGST);
      const getSupplierDetails = await knex("supplier_details")
        .where("gstNo", getGST)
        .select("sap_code");
      if (getSupplierDetails.length <= 0) {
        continue;
      }
      const getPO = await knex("purchase_orders_list").where({
        supplierid: getSupplierDetails[0].sap_code,
        poNumber: getName[0].poNo,
      });
      if (getPO.length <= 0) {
        continue;
      }
      counter += 1;
    }
    // if(counter == 0){
    //   return res.json({
    //     error:true,
    //     message:"PO Doesn't belong toLowerCase() this supplier"

    //   })
    // }
    const uniqId = uuidv4();
    const mapped = await functions.sapMapping(responseData, getName[0].poNo);
    if (mapped.error == true) {
      sapData.push({
        uniqId,
        invoice: getName[0].invoiceName,
        s3Name: invoice,
        check: 1,
        IRN: mapped.IRN ? mapped.IRN : "",
        warning: mapped.warning ? mapped.warning : "",
        poNo: getName[0].poNo,
        type: "",
        header: {},
        Items: [],
        frieght: {},
        grnANDses: [],
      });
    }

    const insertExtractedData = await knex("invoices_textract")
      .where("s3Name", invoice)
      .update({
        textractResponse: JSON.stringify(responseData),
        data: JSON.stringify({
          uniqId,
          invoice: getName[0].invoiceName,
          s3Name: invoice,
          check: 1,
          IRN: mapped.IRN ? mapped.IRN : "",
          warning: mapped.warning ? mapped.warning : "",
          poNo: getName[0].poNo,
          type: mapped.type,
          header: mapped.data ? { ...mapped.data } : {},
          Items: mapped.items ? [...mapped.items] : [],
          frieght: mapped.frieght ? mapped.frieght : {},
          grnANDses: mapped.grn ? mapped.grn : [],
        }),
        status: "scan",
      });

    sapData.push({
      uniqId,
      invoice: getName[0].invoiceName,
      s3Name: invoice,
      check: 1,
      IRN: mapped.IRN ? mapped.IRN : "",
      warning: mapped.warning ? mapped.warning : "",
      poNo: getName[0].poNo,
      type: mapped.type,
      header: mapped.data ? { ...mapped.data } : {},
      Items: mapped.items ? [...mapped.items] : [],
      frieght: mapped.frieght ? mapped.frieght : {},
      grnANDses: mapped.grn ? mapped.grn : [],
    });
  }
  return res.json({
    error: false,
    message: "Invoice fetched successfully",
    textExtracted,
    sapData,
  });
  // } catch (error) {
  //   return res.status(500).json({
  //     error: true,
  //     message: error.message,
  //     data: JSON.stringify(error),
  //   });
  // }
};

const bulkUpload = async (req, res) => {
  try {
    // console.log("this is incoming file",req)
    if (!req.files) {
      return res.json({
        error: true,
        message: "Please upload a file",
      });
    }

    const checkLenght = req.files.file.length;
    if (checkLenght > 10) {
      return res.json({
        error: true,
        message: "Please upload only 10 files",
      });
    }
    const fileNameExists = [];
    const PoNameExists = [];
    const getType = async (po) => {
      const getType = await functions.fetchPODetails(po);
      const firstTwoLetter = po.substring(0, 2);
      const type = getType.PO_HEADER.DOC_TYPE
        ? getType.PO_HEADER.DOC_TYPE
        : firstTwoLetter == "46"
        ? "ZSER"
        : "NB";
      return type;
    };
    if (checkLenght == undefined) {
      const { poNumber } = req.body;
      const checkPoNumber = await knex("purchase_orders_list").where(
        "poNumber",
        "=",
        poNumber
      );
      if (checkPoNumber.length <= 0) {
        return res.json({
          error: true,
          message: "PO Number is not valid",
        });
      }
      const type = await getType(poNumber);
      const file = req.files.file;
      // const schema = Joi.object({
      //   size: Joi.number()
      //     .max(50 * 1024 * 1024)
      //     .required(),
      //   mimetype: Joi.string()
      //     .valid("image/png", "image/jpeg", "image/jpg", "application/pdf")
      //     .required(),
      // });

      const { error, value } = validation.bulkUpload({
        size: file.size,
        mimetype: file.mimetype,
      });
      if (error) {
        return res.json({
          error: true,
          message: error.details[0].message,
        });
      }

      const originalFileName = file.name;
      const UniqueId = uuidv4();
      const modifiedName = UniqueId + originalFileName;
      const buffer = Buffer.from(file.data);
      const getGeneratedFileHash = functions.generateFileHash(buffer);
      const checkDuplicateHash = await functions.checkForDuplicateInvoice(
        getGeneratedFileHash
      );
      if (checkDuplicateHash.error == true) {
        return res.json({
          error: true,
          message: "File already exists",
        });
      }
      const uploadParams = {
        Bucket: constant.bucket + "/tax-invoices",
        Key: `${modifiedName}`,
        Body: buffer,
        ContentType: file.mimetype,
      };

      const resp = await textract.uploadToS3(uploadParams);
      if (resp.error == true) {
        return res.json({
          error: resp.error,
          message: "Failed to upload the invoice",
          data: resp.data,
        });
      }
      const index = resp.data.lastIndexOf("/");
      const path = resp.data.substring(0, index);
      const currentDateIST = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
      let insertName;
      if (file.mimetype == "application/pdf") {
        const pdfPagesName = [];
        const pdfDoc = await PDFDocument.load(req.files.file.data);
        const numPages = pdfDoc.getPageCount();
        if (numPages > 1) {
          for (let i = 0; i < numPages; i++) {
            const subDocument = await PDFDocument.create();
            // copy the page at current index
            const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
            subDocument.addPage(copiedPage);
            const pdfBytes = await subDocument.save();
            // console.log(pdfBytes,"this is pdf bytes")

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
                message: "Failed to upload the invoice",
                data: resp.data,
              });
            }
            pdfPagesName.push(`${i}${modifiedName}`);
          }
          insertName = await knex("invoices_textract").insert({
            invoiceName: originalFileName,
            invoiceId: UniqueId,
            poNo: poNumber,
            poType: type,
            s3Name: modifiedName,
            s3Path: path,
            s3Namepdf: JSON.stringify(pdfPagesName),
            file_hash: getGeneratedFileHash,
            file_data: buffer,
            createdAt: currentDateIST,
            updatedAt: currentDateIST,
          });
        } else {
          const emptyArray = [];
          insertName = await knex("invoices_textract").insert({
            invoiceName: originalFileName,
            invoiceId: UniqueId,
            poNo: poNumber,
            poType: type,
            s3Name: modifiedName,
            s3Path: path,
            s3Namepdf: JSON.stringify(emptyArray),
            file_hash: getGeneratedFileHash,
            file_data: buffer,
            createdAt: currentDateIST,
            updatedAt: currentDateIST,
          });
        }
      } else {
        const emptyArray = [];
        insertName = await knex("invoices_textract").insert({
          invoiceName: originalFileName,
          invoiceId: UniqueId,
          poNo: poNumber,
          poType: type,
          s3Name: modifiedName,
          s3Path: path,
          s3Namepdf: JSON.stringify(emptyArray),
          createdAt: currentDateIST,
          updatedAt: currentDateIST,
        });
      }

      if (insertName <= 0) {
        return res.json({
          error: true,
          message: "Failed to upload the invoice",
        });
      }
      return res.json({
        error: false,
        message: "Invoice uploaded successfully",
        data: insertName,
      });
    } else {
      const { poNumber } = req.body;
      if (poNumber.length < checkLenght) {
        return res.json({
          error: true,
          message: "Please enter PO Number for all files",
        });
      }
      const uploadBulk = await Promise.all(
        req.files.file.map(async (file, index) => {
          // const schema = Joi.object({
          //   size: Joi.number()
          //     .max(50 * 1024 * 1024)
          //     .required(),
          //   mimetype: Joi.string()
          //     .valid("image/png", "image/jpeg", "image/jpg", "application/pdf")
          //     .required(),
          // });

          const { error, value } = validation.bulkUpload({
            size: file.size,
            mimetype: file.mimetype,
          });
          if (error) {
            return res.json({
              error: true,
              message: error.details[0].message,
            });
          }
          const checkFileName = await knex("invoices_textract").where(
            "invoiceName",
            "=",
            file.name
          );
          if (checkFileName.length > 0) {
            fileNameExists.push(file.name);
            return false;
          }
          const poNumber2 = poNumber[index];
          const checkPoNumber = await knex("purchase_orders_list").where(
            "poNumber",
            "=",
            poNumber2
          );
          if (checkPoNumber.length <= 0) {
            PoNameExists.push(poNumber2);
            return false;
          }
          const type = await getType(poNumber2);
          const originalFileName = file.name;
          const UniqueId = uuidv4();
          const modifiedName = UniqueId + originalFileName;
          const buffer = Buffer.from(file.data);
          const getGeneratedFileHash = functions.generateFileHash(buffer);
          const checkDuplicateHash = await functions.checkForDuplicateInvoice(
            getGeneratedFileHash
          );
          if (checkDuplicateHash.error == true) {
            return true;
          }
          const uploadParams = {
            Bucket: constant.bucket + "/tax-invoices",
            Key: `${modifiedName}`,
            Body: buffer,
            ContentType: file.mimetype,
          };
          const resp = await textract.uploadToS3(uploadParams);
          if (resp.error === true) {
            return true;
          }
          const index2 = resp.data.lastIndexOf("/");
          const path = resp.data.substring(0, index2);
          const currentDateIST = moment
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss");
          let insertName;
          if (file.mimetype == "application/pdf") {
            const pdfPagesName = [];
            const pdfDoc = await PDFDocument.load(file.data);
            const numPages = pdfDoc.getPageCount();
            if (numPages > 1) {
              for (let i = 0; i < numPages; i++) {
                const subDocument = await PDFDocument.create();
                // copy the page at current index
                const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
                subDocument.addPage(copiedPage);
                const pdfBytes = await subDocument.save();
                // console.log(pdfBytes,"this is pdf bytes")

                const buffer = Buffer.from(pdfBytes);
                const name = modifiedName;
                const uploadParams = {
                  Bucket: constant.bucket + "/tax-invoices",
                  Key: `${i}${modifiedName}`,
                  Body: buffer,
                  ContentType: file.mimetype,
                };
                const resp = await textract.uploadToS3(uploadParams);
                if (resp.error === true) {
                  return res.json({
                    error: resp.error,
                    message: "Failed to upload the invoice",
                    data: resp.data,
                  });
                }
                pdfPagesName.push(`${i}${modifiedName}`);
              }
              insertName = await knex("invoices_textract").insert({
                invoiceName: originalFileName,
                invoiceId: UniqueId,
                poNo: poNumber2,
                poType: type,
                s3Name: modifiedName,
                s3Path: path,
                s3Namepdf: JSON.stringify(pdfPagesName),
                file_hash: getGeneratedFileHash,
                file_data: buffer,
                createdAt: currentDateIST,
                updatedAt: currentDateIST,
              });
            } else {
              const emptyArray = [];
              insertName = await knex("invoices_textract").insert({
                invoiceName: originalFileName,
                invoiceId: UniqueId,
                poNo: poNumber2,
                poType: type,
                s3Name: modifiedName,
                s3Path: path,
                s3Namepdf: JSON.stringify(emptyArray),
                file_hash: getGeneratedFileHash,
                file_data: buffer,
                createdAt: currentDateIST,
                updatedAt: currentDateIST,
              });
            }
          } else {
            const emptyArray = [];
            insertName = await knex("invoices_textract").insert({
              invoiceName: originalFileName,
              invoiceId: UniqueId,
              poNo: poNumber2,
              poType: type,
              s3Name: modifiedName,
              s3Path: path,
              s3Namepdf: JSON.stringify(emptyArray),
              file_hash: getGeneratedFileHash,
              file_data: buffer,
              createdAt: currentDateIST,
              updatedAt: currentDateIST,
            });
          }
          if (insertName <= 0) {
            return true;
          }
          return false;
        })
      );
      const index = [];
      const name = [];
      uploadBulk.forEach((element, index) => {
        if (element == true) {
          index.push(index);
          name.push(req.files.file[index].name);
        }
      });
      return res.json({
        error: false,
        message: "Invoices uploaded successfully",
        data: {
          failedToInsert: fileNameExists,
          index: index,
          name: name,
        },
      });
    }
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
      data: "error here.",
    });
  }
};

const paginateInvoices = async (req, res) => {
  try {
    const { error, value } = validation.paginateInvoices(req.body);

    const { offset, limit, order, sort, search, status = "1" } = value;

    let total = 0;
    let results = knex("invoices_textract");
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

    let rows = knex("invoices_textract");
    //.whereNull("textractResponse")

    if (status != undefined && status != "") {
      rows.where("status", status);
    }

    const searchFrom = ["invoiceName", "supplierId", "s3Name", "s3Path"];
    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    // if (search != undefined && search != "") {
    //   const searchFrom = ["invoiceName", "supplierId", "s3Name", "s3Path"]
    //  rows = rows.where((builder) => {
    //     searchFrom.forEach((element) => {
    //       builder.orWhereILike(element, `%${search}%`);
    //     })
    //   })
    // }

    // const total = await rows.count("id as total").first();
    let rows2 = [];
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    //rows2.push(rows)
    let sr = offset + 1;
    // Convert rows toLowerCase() an array of objects
    rows.forEach((row, index) => {
      row.sr = sr;
      delete row.file_data;
      sr++;
      rows2.push(row);
    });

    return res.json({
      error: false,
      message: "Retrieved successfully.",
      data: rows2,
      total: total.total, // Assuming total is an object with the property 'total'
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
      data: "error here.",
    });
  }
};

// const list = async (req, res) => {
//   const tableName = "invoices";
//   const getInvoices = await functions.getData(tableName);
//   if (!getInvoices) {
//     return res
//       .json({
//         error: true,
//         message: "Getting Invoice from the database failed",
//       })
//       .end();
//   }

//   return res
//     .json({
//       error: false,
//       message: "Invoice fetched successfully",
//       data: getInvoices,
//     })
//     .end();
// };

const convertKeysToCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      let newKey = key.replace(/_([a-z])/g, (match) => match[1].toUpperCase()); // Snake case toLowerCase() camelCase
      newKey = newKey
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => {
          return index === 0 ? match.toLowerCase() : match.toUpperCase();
        })
        .replace(/\s+/g, ""); // Keys with spaces toLowerCase() camelCase
      acc[newKey] = convertKeysToCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

const listdata = async (req, res) => {
  try {
    const tableName = "invoices";
    const getInvoices = await functions.getData(tableName);
    if (!getInvoices) {
      return res.json({
        error: true,
        message: "Getting Invoice from the database failed",
      });
    }

    const camelCaseInvoices = convertKeysToCamelCase(getInvoices);

    return res.json({
      error: false,
      message: "Invoice fetched successfully",
      data: camelCaseInvoices,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewdata = async (req, res) => {
  try {
    const { error, value } = validation.viewdata(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getInvoiceData = await functions.viewInvoiceData("invoices", id);

    if (!getInvoiceData) {
      return res.json({
        error: true,
        message: "Invoice not found",
      });
    }
    return res.json({
      error: false,
      message: "Invoice fetched successfully",
      getInvoiceData,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const deletedata = async (req, res) => {
  try {
    const { error, value } = validation.deletedata(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getInvoiceData = await functions.deleteInvoiceData("invoices", id);

    if (getInvoiceData == "record does not exist") {
      return res.json({
        error: true,
        message: "Invoice not found",
      });
    }
    return res.json({
      error: false,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updatedata = async (req, res) => {
  try {
    //toLowerCase() do : write update code
    const { error, value } = validation.updatedata(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, data, table } = value;

    ////storing data on success toLowerCase() dynamodb///////////

    const tableName = "invoices";
    const items = {
      id: id,
    };
    response.data.data.id = id;
    response.data.data.supplier_id = supplierId;
    response.data.data.created_at = new Date() + "";
    response.data.data.table = response.data.table;
    const insertParams = {
      TableName: tableName,
      Item: items,
    };
    const result = await functions.insertData(insertParams);
    if (!result) {
      return {
        error: true,
        message: "Inserting Invoice in the database failed",
      };
    }
    ////inserting in dynamo db - over ////////////////////////
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const insertToSap = async (req, res) => {
  // try {
  // const schema = Joi.object({
  //   sapData: Joi.array()
  //     .items(
  //       Joi.object({
  //         uniqId: Joi.string().allow("", null),
  //         invoice: Joi.string().allow("", null),
  //         s3Name: Joi.string().allow("", null),
  //         poNo: Joi.string().allow("", null),
  //         header: Joi.object({
  //           postingDate: Joi.string().allow("", null),
  //           documentDate: Joi.string().allow("", null),
  //           reference: Joi.string().allow("", null),
  //           headerText: Joi.array().allow("", null),
  //           companyCode: Joi.string().allow("", null),
  //           currency: Joi.string().allow("", null),
  //           baselineDate: Joi.string().allow("", null),
  //           totalInvoiceAmount: Joi.number().allow(null),
  //           parkPostIndicator: Joi.string().allow("", null),
  //           taxAmount: Joi.number().allow("", null),
  //         }).allow(null),
  //         Items: Joi.array()
  //           .items(
  //             Joi.object({
  //               invoiceItemId: Joi.number().allow(null),
  //               po: Joi.string().allow("", null),
  //               PO_Item: Joi.string().allow("", null),
  //               amount: Joi.number().allow(null),
  //               TaxCode: Joi.string().allow("", null),
  //               plant: Joi.string().allow("", null),
  //               quantity: Joi.number().allow(null),
  //               hsnCode: Joi.string().allow("", null),
  //               poUnit: Joi.string().allow("", null),
  //               grnDoc: Joi.string().allow("", null),
  //               grnDocYear: Joi.string().allow("", null),
  //               grnDocItem: Joi.string().allow("", null),
  //               SES: Joi.string().allow("", null),
  //               serviceActivity: Joi.string().allow("", null),
  //             }).allow(null)
  //           )
  //           .allow(null),
  //       }).allow(null)
  //     )
  //     .required(),
  // });

  // const { error, value } = schema.validate(req.body);
  // if (error) {
  //   return res.json({
  //     error: true,
  //     message: error.details[0].message,
  //   });
  // }

  const { sapData } = req.body;
  const failedToInsert = [];
  let i = 0;
  for (const iterator of sapData) {
    const checkInDb = await knex("invoices_textract")
      .whereNull("sapInvoiceId")
      .where("invoiceName", iterator.invoice)
      .andWhere("s3Name", iterator.s3Name);
    if (checkInDb.length <= 0) {
      iterator.sr = i;
      failedToInsert.push(iterator.invoice);
      continue;
    }
    let type = "";
    const getPoDetails = await functions.fetchPODetails(iterator.poNo);
    if (getPoDetails != undefined) {
      type = getPoDetails.PO_HEADER ? getPoDetails.PO_HEADER.DOC_TYPE : null;
      if (type == "ZSER") {
        const lengthofTextract = iterator.Items.length;
        const lengthofSap = getPoDetails.PO_ITEM_SERVICES.length;
        if (lengthofTextract > lengthofSap) {
          iterator.sr = i;
          failedToInsert.push({
            invoice: iterator.invoice,
            message: "Line items are more than PO.",
          });
          continue;
        }
      } else {
        const lengthofTextract = iterator.Items.length;
        const lengthofSap = getPoDetails.PO_ITEMS.length;
        if (lengthofTextract > lengthofSap) {
          iterator.sr = i;
          failedToInsert.push({
            invoice: iterator.invoice,
            message: "Line items are more than PO.",
          });
          continue;
        }
      }
    } else {
      iterator.sr = i;
      failedToInsert.push({
        invoice: iterator.invoice,
        message: "Failed to fetch PO Details.",
      });
      continue;
    }
    // const uniqId = uuidv4();
    let giId;
    let sesId;
    let grnId;
    console.log(type, "this is type");
    if (type == "ZSER") {
      const insertSes = await knex("ses").insert({
        poNo: iterator.poNo,
        sesUniqueId: iterator.grnANDses.UNIQUE_TRANSACTION_ID,
        header: JSON.stringify(iterator.grnANDses.header),
        item: JSON.stringify(iterator.grnANDses.ITEM),
        createdAt: iterator.grnANDses.TIME_STAMP,
      });
      if (!insertSes) {
        iterator.sr = i;
        failedToInsert.push(iterator);
        continue;
      }
      sesId = insertSes;
    } else if (type == "") {
      continue;
    } else {
      const insertGi = await knex("gis").insert({
        poNo: iterator.poNo,
        giUniqueId: iterator.grnANDses.UNIQUE_TRANSACTION_ID,
        vendor: iterator.grnANDses.VENDOR,
        item: JSON.stringify(iterator.grnANDses.ITEM),
      });

      if (!insertGi) {
        iterator.sr = i;
        failedToInsert.push(iterator);
        continue;
      } else {
        giId = insertGi;
      }
      const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
      const insertGrn = await knex("grns").insert({
        poNo: iterator.poNo,
        grnUniqueId: iterator.grnANDses.GRN.UNIQUE_TRANSACTION_ID,
        postingDate: iterator.grnANDses.GRN.POSTING_DATE,
        item: JSON.stringify(iterator.grnANDses.GRN.ITEM),
        documentDate: iterator.grnANDses.GRN.DOCUMENT_DATE,
        companyCode: iterator.grnANDses.GRN.COMPANY_CODE,
        // batchNo: iterator.grnANDses.GRN.BATCH_NO,
        created_at: currentDateIST,
      });
      if (insertGrn) {
        grnId = insertGrn;
      }
    }

    const emptyArray = [];
    const insertPoDetails = await knex("invoicesToSap").insert({
      poNo: iterator.poNo,
      // asn_id: asn_id,
      invoiceUniqueId: iterator.uniqId,
      invoiceCode: JSON.stringify(emptyArray),
      header: JSON.stringify(iterator.header),
      items: JSON.stringify(iterator.Items),
    });
    if (insertPoDetails <= 0) {
      iterator.sr = i;
      failedToInsert.push(iterator);
    }
    const updateInTextractTable = await knex("invoices_textract")
      .update({
        sapInvoiceId: insertPoDetails,
        sapGrnId: grnId,
        sapGiId: giId,
        sapSesId: sesId,
        status: "approved",
      })
      .where("invoiceName", iterator.invoice)
      .andWhere("s3Name", iterator.s3Name);
    i++;
  }
  let message = "Invoice aprroved successfully.";

  if (failedToInsert.length > 0) {
    message = `Some Invoice failed to process. ${failedToInsert.length} out of ${sapData.length} records failed.`;
    if (failedToInsert.length == sapData.length) {
      return res.json({
        error: true,
        message: "Failed to submit data to SAP",
        failedToInsert,
      });
    }
  }
  return res.json({
    error: false,
    message,
    failedToInsert,
  });
  // } catch (error) {
  //   return res.json({
  //     error: true,
  //     message: "Something went wrong.",
  //     data: { error: JSON.stringify(error) },
  //   });
  // }
};

const deleteInvoice = async (req, res) => {
  try {
    const { error, value } = validation.deleteInvoice(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { s3Name, invoiceId } = value;
    const data = {
      status: "0",
    };

    const getIDfirst = await knex("invoices_textract")
      .where("invoiceId", invoiceId)
      .andWhere("s3Name", s3Name)
      // .andWhere("status", "1")
      // .first();

      if (getIDfirst.length <= 0) {
        return res.json({
          error: true,
          message: "Invoice not found",
        });
      }

      if(getIDfirst){
        const temp = ['scan','rescan','uploaded']
       if(!temp.includes(getIDfirst[0].status)){
        return res.json({
          error: true,
          message: "This invoice can not be deleted.",
        })
       } 
      }

    // const updationDataIs = await functions.takeSnapShot("invoices_textract",getIDfirst.id);

    const getInvoiceData = await knex("invoices_textract")
      // .update(data)
      .where("invoiceId", invoiceId)
      .andWhere("s3Name", s3Name)
      .whereIn('status',['scan','rescan','uploaded'])
      .del()
      // .andWhere("status", "1");

    // if (getIDfirst) {
    //   const modifiedByTable1 = await functions.SetModifiedBy(
    //     req.headers["authorization"],
    //     "invoices_textract",
    //     "id",
    //     getIDfirst.id
    //   );
    //   console.log("isUpdated:-", modifiedByTable1);
    // }
    return res.json({
      error: false,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const translateAndtextract = async (req, res) => {
  // Configure AWS credentials and region
  AWS.config.update({
    region: constant.aws.region,
    accessKeyId: constant.aws.accessKey,
    secretAccessKey: constant.aws.secret,
  });

  // Create Textract and Translate clients
  const textract = new AWS.Textract();
  const translate = new AWS.Translate();
  const textExtracted = [];
  async function translatePDF(pdfBuffer) {
    // 1. Use Textract toLowerCase() extract text blocks from the PDF
    const textractParams = {
      Document: {
        Bytes: pdfBuffer,
      },
    };

    try {
      const textractResponse = await textract
        .detectDocumentText(textractParams)
        .promise();
      const blocks = textractResponse.Blocks;

      // 2. Loop through text blocks and identify the language
      const textToTranslate = [];
      for (const block of blocks) {
        if (block.BlockType === "LINE") {
          const text = block.Text;
          textExtracted.push(text);
          const identifiedLanguage =
            block.Confidence === 1.0 ? block.LanguageCode : "en"; // Use English as fallback
          //  /   console.log("this is language",identifiedLanguage)
          // 3. Translate the text block using Translate
          const translateParams = {
            SourceLanguageCode: identifiedLanguage,
            TargetLanguageCode: "gu", // Replace with target language code
            Text: text,
          };

          const translateResponse = await translate
            .translateText(translateParams)
            .promise();
          const translatedText = translateResponse.TranslatedText;

          textToTranslate.push(`${translatedText}\n`); // Add newline for each translated block
        }
      }

      // 4. Return the translated text as a string
      return textToTranslate.join("");
    } catch (error) {
      return res.json({
        error: true,
        message: "Something went wrong.",
        data: { error: JSON.stringify(error) },
      });
      console.error("Error during Textract or Translate:", error);
      throw error;
    }
  }

  // Example usage (replace with your actual PDF buffer)
  const pdfBuffer = req.files.file.data; // Replace with your PDF buffer

  translatePDF(pdfBuffer)
    .then((translatedText) => {
      return res.json({
        error: false,
        message: "Translated Text",
        textExtracted,
        data: translatedText,
      });
    })
    .catch((error) => {
      console.error("Error translating PDF:", error);
    });
};

// const translate = async (req, res) => {
//   let extractedData = "";
//   const parsedData = await pdf(req.files.file.data);
//   extractedText += parsedData.text;
//   const translateParams = {
//     SourceLanguageCode: "auto", // Auto-detect source language
//     TargetLanguageCode: "en", // Replace with target language code
//     Text: extractedText,
//   };

//   const translateResponse = await translate
//     .translateText(translateParams)
//     .promise();
//   const translatedText = translateResponse.TranslatedText;

//   return res.json({
//     error: false,
//     message: "Translated Text",
//     data: translatedText,
//   });
// };

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "invoices";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const getPOListForTextract = async (req, res) => {
  try {
    const getList = await knex("purchase_orders_list").where("isOpen", "1");

    return res.json({
      error: false,
      data: getList,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "failed to fetch po list",
      data: [],
    });
  }
};

const textractSubmittedInvocieList = async (req, res) => {
  try {
    const tableName = "invoices_textract";
    const sapInvoiceTableName = "invoicesToSap"
    const { error, value } = validation.textractSubmittedInvocieList(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { offset, limit, order, sort, search, status, filter } = value;

    let rows = knex(tableName)
      .select(
        `${tableName}.id`,
        `${tableName}.invoiceName`,
        `${tableName}.poNo`,
        `${tableName}.poType`,
        `${tableName}.data`,
        `${tableName}.status`,
        `${sapInvoiceTableName}.invoiceUniqueId`,
        `${sapInvoiceTableName}.invoiceCode`,
        `${sapInvoiceTableName}.poNo`,
        `${sapInvoiceTableName}.parkTime`
      )
      .leftJoin(
        sapInvoiceTableName,
        `${tableName}.sapInvoiceId`,
        `${sapInvoiceTableName}.id`
      )
      .whereNotNull("sapInvoiceId");

    if (search) {
      rows = rows.where((builder) => {
        builder.where(`${tableName}.invoiceName`, "like", `%${search}%`);
      });
    }

    if (status) {
      rows = rows.where(`${tableName}.status`, status);
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();

        if (dateField === "parkTime") {
          results.whereBetween(`${sapInvoiceTableName}.parkTime`, [
            startDateISO,
            endDateISO,
          ]);
        }
      }
    }

    const total = await rows.clone().count(`${tableName}.id as total`).first();
    rows = rows
      .orderBy(`${tableName}.${sort}`, order)
      .limit(limit)
      .offset(offset);

    let data_rows = await rows;
    let sr = offset + 1;
    data_rows = await Promise.all(
      data_rows.map(async (row) => {
        row.sr = order === "desc" ? sr++ : total.total - limit * offset--;
        row.data = row.data ? JSON.parse(row.data) : row.data;
        row.invoiceCode = row.invoiceCode
          ? JSON.parse(row.invoiceCode)
          : row.invoiceCode;
        const sapErrors = [];
        const sapError = await knex("sap_errors").where(
          "uniqueId",
          row.invoiceUniqueId
        );
        for (const element of sapError) {
          const temp =
            element.errors != undefined ? JSON.parse(element.errors) : [];
          sapErrors.push(...temp);
        }
        row.sapErrors = sapErrors;
    
        return row;
      })
    );

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};


const invoiceDashboardStatusCount = async (req, res) => {
  try {
    const tableName = "invoices_textract";
    const [statusCounts, totalCount, sapInvoiceIds] = await Promise.all([
      knex(tableName).select("status").count("* as count").groupBy("status"),

      knex(tableName).count("* as total"),

      knex(tableName).select('sapInvoiceId').whereNotNull('sapInvoiceId')
    ]);

    const sapInvoiceIdsArray = sapInvoiceIds.map(item => item.sapInvoiceId);

    const getParkPostCount =await knex('invoicesToSap').select('status').count("* as count").groupBy("status").whereIn('id',sapInvoiceIdsArray).whereNotNull('status')

    const status = {
      'uploaded':0,
      'invoiced':0,
      'rescan':0,
      'scan':0,
      'approved':0,
      'saperror':0
    }

    const parkPost = {
      'park':0,
      'post':0
    }

    for (const element of statusCounts) {
      status[element.status] = element.count
    }

    for (const element of getParkPostCount) {
      parkPost[element.status] = element.count
    }

    // const statusObject =await functions.returnStatusCount(statusCounts);

    // const postParkObject =await functions.returnStatusCount(getParkPostCount)
 
    return res.json({
      error: false,
      message: "fetched successfully",
      data: {
        statusWise:status,
        parkPost:parkPost,
        totalCount: totalCount[0].total,
        
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "failed to fetch count",
      data: [],
    });
  }
};


export default {
  Textract,
  forMapping,
  bulkUpload,
  paginateInvoices,
  listdata,
  viewdata,
  deletedata,
  updatedata,
  mapping,
  automateInvoice,
  insertToSap,
  deleteInvoice,
  automateInvoice2,
  translateAndtextract,
  // translate,
  delteMultipleRecords,
  getPOListForTextract,
  textractSubmittedInvocieList,
  invoiceDashboardStatusCount,
};
