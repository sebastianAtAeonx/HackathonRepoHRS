import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import QRCode from "qrcode";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import moment from "moment-timezone";
import { constants } from "fs/promises";
import e from "express";
import { type } from "os";
import sap from "../../helpers/sap.js";
import jwt from "jsonwebtoken";
import constant from "../../helpers/constants.js";
import notification from "../notification.js";
import validation from "../../validation/workflow/grn.js";

// import { get } from "express/lib/response.js";

//bhaveshsirs code
// const normalgrn = async (req, res) => {
//   const schema = Joi.object({
//     asnNo: Joi.string().required(),
//     UNIQUE_TRANSACTION_ID: Joi.string().required(),
//     POSTING_DATE: Joi.string().required(),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//     });
//   }

//   const { asnNo, UNIQUE_TRANSACTION_ID, POSTING_DATE } = value;
//   const getAsnDataForSap = await knex("asns")
//     .where({ asnNo: asnNo })
//     .select("poNo", "lineItems");
//   if (getAsnDataForSap.length <= 0) {
//     return res.json({
//       error: true,
//       message: "No ASN data found",
//     });
//   }

//   // console.log("this is u", UNIQUE_TRANSACTION_ID);
//   const timeis = Date();
//   console.log("this is ", timeis);
//   // getAsnDataForSap[0].test = "test";
//   getAsnDataForSap[0].UNIQUE_TRANSACTION_ID = UNIQUE_TRANSACTION_ID;
//   getAsnDataForSap[0].POSTING_DATE = POSTING_DATE;
//   getAsnDataForSap[0].TIME_STAMP = timeis.slice(16, 25);
//   // getAsnDataForSap[0].COMPANY_CODE = "this";

//   for (const iterator of getAsnDataForSap) {
//     iterator.ITEM = JSON.parse(iterator.lineItems);
//     for (const i of iterator.ITEM) {
//       i.MATERIAL_NO = i.material;
//       delete i.material;
//       i.STORAGE_LOC = i.storageLocation;
//       delete i.storageLocation;
//       i.BATCH_NO = "";
//       i.QUANTITY = i.Quantity;
//       delete i.Quantity;
//       i.UOM = i.uom;
//       delete i.uom;
//       i.STOCK_TYPE = "";
//       i.SPECIAL_STOCK_INDICATOR = i.specStock;
//       delete i.specStock;
//       i.PO_ITEM = i.poItem;
//       delete i.poItem;
//       i.PO_NUMBER = iterator.poNo;
//       // i.COMPANY_CODE = iterator.coCode;
//       // i.DOC_DATE = iterator.docDate;
//       // delete i.COMPANY_CODE
//       // i.hello = iterator.coCode;
//       // i.this = "this";

//       delete i.itemName;
//       delete i.unit;
//       delete i.materialCode;
//       delete i.materialDescription;
//       delete i.pricePerUnit;
//       delete i.price;
//       delete i.gst;
//       delete i.subTotal;
//       delete i.hsnCode;
//       delete i.weight;
//       delete i.dimension;
//     }
//     delete iterator.lineItems;
//     delete iterator.poNo;
//   }

//   return res.json({
//     error: false,
//     message: "Data fetched successfully.",
//     data: getAsnDataForSap,
//   });
// };

const normalgrn = async (req, res) => {
  const { error, value } = validation.normalgrn(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { asnNo, poNo } = value;

  const checkAsnPoTogether = await knex("asns")
    .where({ poNo: poNo, asnNo: asnNo })
    .first();

  if (checkAsnPoTogether == undefined) {
    return res.status(404).json({
      error: true,
      message: "ASN and PO are not matching",
    });
  }

  const getAsnDataForSap = await knex("asns")
    .where({ poNo: poNo })
    .select("poNo", "lineItems");
  if (getAsnDataForSap.length <= 0) {
    return res.status(404).json({
      error: true,
      message: "PoNo does not exist",
    });
  }
  const timeis = new Date();

  //fetch po details

  const poDetails = await fun.fetchPODetails(getAsnDataForSap[0].poNo);

  const result = {
    UNIQUE_TRANSACTION_ID: uuidv4(),
    POSTING_DATE:
      timeis.getFullYear() +
      "-" +
      String(timeis.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(timeis.getDate()).padStart(2, "0"),
    //bring data from PO
    ITEM: [],
    DOCUMENT_DATE: poDetails.data.data.PO_HEADER.DOC_DATE, //bring  up from po
    COMPANY_CODE: poDetails.data.data.PO_HEADER.CO_CODE, //bring up from po
    BATCH_NO: poDetails.data.data.PO_ITEM_SCHEDULES.BATCH + "",

    TIME_STAMP:
      timeis.getHours() + ":" + timeis.getMinutes() + ":" + timeis.getSeconds(),
  };

  for (const iterator of getAsnDataForSap) {
    getAsnDataForSap.COMPANY_CODE = iterator.coCode;
    const items = JSON.parse(iterator.lineItems);
    delete iterator.lineItems;
    for (const i of items) {
      result.ITEM.push({
        MATERIAL_NO: i.material,
        STORAGE_LOC: i.storageLocation,
        QUANTITY: i.Quantity,
        UOM: i.uom,
        STOCK_TYPE: "",
        SPECIAL_STOCK_INDICATOR: i.specStock,
        PO_ITEM: i.poItem,
        PO_NUMBER: iterator.poNo,
      });
    }
  }
  return res.status(200).json({
    error: false,
    message: "Data fetched successfully.",
    data: result,
  });
};

const incomingInvoice = async (req, res) => {
  try {
    const { error, value } = validation.incomingInvoice(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      poNo,
      asnNo,
      reference,
      baselineDate,
      parkPostIdicator,
      grnDoc,
      grnDocYear,
      grnDocItem,
      freightConditionCode,
      freightAmount,
    } = value;

    const checkAsnPoNoTogether = await knex("asns")
      .where({ poNo: poNo, asnNo: asnNo })
      .first();
    if (checkAsnPoNoTogether == undefined) {
      return res.status(404).json({
        error: true,
        message: "ASN and PO are not matching",
      });
    }

    const getAsnDataForSap = await knex("asns")
      .where({ poNo: poNo })
      .select("asnNo", "lineItems")
      .first();

    if (getAsnDataForSap == undefined) {
      return res.status(404).json({
        error: true,
        message: "PoNo does not exist",
      });
    }

    //console.log("asndata", getAsnDataForSap);

    const poDetails = await fun.fetchPODetails(poNo);
    //console.log(poDetails.data.data.PO_HEADER.CO_CODE);
    //console.log(poDetails.data.data.PO_HEADER.DOC_DATE);

    const HeaderData = {
      postingDate: new Date(),
      documentDate: poDetails.data.data.PO_HEADER.DOC_DATE,
      reference: reference,
      headerText: poDetails.data.data.PO_HEADER_TEXTS,
      companyCode: poDetails.data.data.PO_HEADER.CO_CODE,
      currency: poDetails.data.data.PO_HEADER.CURRENCY,
      baselineDate: baselineDate,
      totalInvoiceAmount: "",
      parkPostIndicator: parkPostIdicator,
    };
    let totalInvoiceAmount = 0;
    const ItemsData = [];
    for (const iterator of poDetails.data.data.PO_ITEMS) {
      totalInvoiceAmount += iterator.NET_VALUE;
      const currentData = {
        invoiceItemId: "",
        po: getAsnDataForSap.poNo,
        poItem: iterator.PO_ITEM,
        grnDoc: grnDoc,
        grnDocYear: grnDocYear,
        grnDocItem: grnDocItem,
        taxCode: iterator.TAX_CODE,
        amaount: iterator.NET_VALUE,
        quantity: iterator.QUANTITY,
        poUnit: iterator.UNIT,
      };
      ItemsData.push(currentData);
    }

    HeaderData.totalInvoiceAmount = totalInvoiceAmount;

    const FreightData = {
      freightConditionCode: freightConditionCode,
      freightAmount: freightAmount,
    };

    //////////////////////////////table insertion code//////////////////////

    const tableName = "invoices";

    const checkRecord = await knex(tableName).where({
      asnNo: getAsnDataForSap.asnNo,
    });
    if (checkRecord.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Record already exists",
      });
    }

    const insertRecord = await knex(tableName).insert({
      asnNo: getAsnDataForSap.asnNo,
      postingDate: HeaderData.postingDate,
      documentDate: HeaderData.documentDate,
      reference: HeaderData.reference,
      headerText: JSON.stringify(HeaderData.headerText),
      companyCode: HeaderData.companyCode,
      currency: HeaderData.currency,
      baselineDate: HeaderData.baselineDate,
      totalInvoiceAmount: HeaderData.totalInvoiceAmount,
      parkPostIdicator: HeaderData.parkPostIndicator,
      items: JSON.stringify(ItemsData),
      freightConditionCode: FreightData.freightConditionCode,
      freightAmount: FreightData.freightAmount,
    });

    /////////////////////////////table insertion code over /////////////////

    const finalresult = {
      Header: HeaderData,
      Items: ItemsData,
      Freight: FreightData,
    };
    if (!insertRecord) {
      return res.status(500).json({
        error: true,
        message: "data not inserted",
      });
    }
    return res.status(200).json({
      error: false,
      message: "data inserted successfully",
      data: finalresult,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not insert record",
      data: error.message,
    });
  }
};

const listInvoice = async (req, res) => {
  try {
    const tableName = "invoices";
    const searchFrom = ["headerText", "companyCode"];

    const { error, value } = validation.listInvoice(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let results = knex(tableName);
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
    const total = await results.count("id as total").first();
    let rows = knex(tableName);
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

    for (const iterator of rows) {
      iterator.items = JSON.parse(iterator.items); // Parse the stringified items back to an array
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
      let sr = total.total - offset;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load record",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewInvoice = async (req, res) => {
  const { error, value } = validation.view(req.params);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { id } = value;
  const invoice = await knex("invoices").where({ id: id }).first();
  if (!invoice) {
    return res.status(404).json({
      error: true,
      message: "No invoice found",
    });
  }
  invoice.items = JSON.parse(invoice.items); // Parse the stringified items back to an array

  const Header = {
    postingDate: invoice.postingDate,
    documentDate: invoice.documentDate,
    reference: invoice.reference,
    headerText: invoice.headerText,
    companyCode: invoice.companyCode,
    currency: invoice.currency,
    baselineDate: invoice.baselineDate,
    totalInvoiceAmount: invoice.totalInvoiceAmount,
    parkPostIndicator: invoice.parkPostIndicator,
  };

  const Items = invoice.items;

  const Freight = {
    freightConditionCode: invoice.freightConditionCode,
    freightAmount: invoice.freightAmount,
  };

  const invoiceData = {
    Header: Header,
    Items: Items,
    Freight: Freight,
  };

  return res.status(200).json({
    error: false,
    message: "Invoice retrieved successfully.",
    data: invoiceData,
  });
};

const updateInvoice = async (req, res) => {
  const { error, value } = validation.updateInvoice(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const {
    postingDate,
    documentDate,
    reference,
    headerText,
    companyCode,
    currency,
    baselineDate,
    totalInvoiceAmount,
    parkPostIndicator,
    items,
    freightConditionCode,
    po,
    poItem,
    grnDoc,
    grnDocYear,
    grnDocItem,
    taxCode,
    freightAmount,
    quantity,
  } = value;

  const itemsAre = JSON.stringify(items);

  const { id } = value;
  const invoice = await knex("invoices").where({ id: id }).first();
  if (!invoice) {
    return res.status(404).json({
      error: true,
      message: "No invoice found",
    });
  }
  const updateInvoice = await knex("invoices")
    .where({ id: id })
    .update(req.body);

  if (!updateInvoice) {
    return res.status(500).json({
      error: true,
      message: "Invoice not updated",
    });
  }

  return res.status(200).json({
    error: false,
    message: "Invoice updated successfully.",
  });
};

const deleteInvoice = async (req, res) => {
  const { error, value } = validation.deleteInvoice(req.params);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { id } = value;
  const invoice = await knex("invoices").where({ id: id }).first();
  if (!invoice) {
    return res.status(404).json({
      error: true,
      message: "No invoice found",
    });
  }
  const deleteInvoice = await knex("invoices").where({ id: id }).del();
  if (!deleteInvoice) {
    return res.status(500).json({
      error: true,
      message: "Invoice not deleted",
    });
  }
  return res.status(200).json({
    error: false,
    message: "Invoice deleted successfully.",
  });
};

//GRNtoSAP written by Rahul
const GRNtoSAP = async (req, res) => {
  try {
    const { error, value } = validation.grnToSap(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    let { fromDate, toDate, Days } = value;

    if (fromDate && toDate) {
      fromDate = req.body.fromDate;
      toDate = req.body.toDate;
    } else {
      if (!fromDate && !toDate) {
        fromDate = new Date();
        toDate = new Date();
        fromDate.setDate(fromDate.getDate() - Days);
      } else if (!fromDate && toDate) {
        toDate = new Date(toDate);
        fromDate = new Date(toDate);
        fromDate.setDate(toDate.getDate() - Days);
      } else if (fromDate && !toDate) {
        fromDate = new Date(fromDate);
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + Days);
      }

      fromDate = fromDate.toISOString().split("T")[0];
      toDate = toDate.toISOString().split("T")[0];
    }

    const fetchFromASNTimeline = await knex("asnStatusTimeline")
      .whereIn("MaterialReceivedStatus", [
        "materialReceived",
        "partiallyReceived",
      ])
      .whereRaw("DATE(MaterialReceivedTime) BETWEEN ? AND ?", [
        fromDate,
        toDate,
      ])
      .select("asn_id");

    let idsForASN = [];

    for (const iterator of fetchFromASNTimeline) {
      idsForASN.push(iterator.asn_id);
    }

    const asnRow = await knex("asnMaterialReceived").whereIn(
      "asn_id",
      idsForASN
    );

    async function processRow(item) {
      let asn_id;
      if (item.type != "ZSER") {
        asn_id = item.asn_id;
      } else {
        asn_id = item.id;
      }
      const checkInDb = await knex("grns")
        .select(
          "grnUniqueId as UNIQUE_TRANSACTION_ID",
          "postingDate as POSTING_DATE",
          "item as ITEM",
          "documentDate as DOCUMENT_DATE",
          "companyCode as COMPANY_CODE",
          "batchNo as BATCH_NO",
          "grnCode",
          "grnYear",
          "grnItem"
        )
        .where({ asn_id: asn_id });

      if (checkInDb.length > 0) {
        if (
          checkInDb[0].grnCode == null &&
          checkInDb[0].grnYear == null &&
          checkInDb[0].grnItem == null
        ) {
          checkInDb[0].ITEM = JSON.parse(checkInDb[0].ITEM);
          delete checkInDb[0].grnCode;
          delete checkInDb[0].grnStatus;
          return checkInDb[0];
        }
      } else {
        const poDetails = await fun.fetchPODetails(item.poNo);
        if (!poDetails.error) {
          const items = JSON.parse(item.lineItems);
          let ITEM = [];
          let storageLocation;
          if (item.storageLocation) {
            storageLocation = await knex("storage_locations")
              .select("code")
              .where({ id: item.storageLocation })
              .first();
            if (storageLocation == null || storageLocation == undefined) {
              storageLocation = await knex("storage_locations")
                .select("code")
                .first();
            }
            console.log("going here and code is :", storageLocation);
          } else {
            storageLocation = await knex("storage_locations")
              .select("code")
              .first();
            console.log("going in else and code is :", storageLocation);
          }
          console.log(
            "this is asn :",
            item.asn_id,
            " this is storage location :",
            storageLocation
          );
          const UNIQUE_TRANSACTION_ID = uuidv4();
          items.forEach((i) => {
            if (i.Quantity > 0) {
              ITEM.push({
                MATERIAL_NO: i.material,
                STORAGE_LOC: storageLocation ? storageLocation.code : "",
                QUANTITY: i.Quantity,
                UOM: i.uom,
                STOCK_TYPE: "",
                SPECIAL_STOCK_INDICATOR: poDetails.PO_ITEMS.SPEC_STOCK
                  ? poDetails.PO_ITEMS.SPEC_STOCK
                  : i.specStock,
                PO_ITEM: i.poItem,
                PO_NUMBER: item.poNo,
              });
            }
          });

          const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
          const insertGrn = await knex("grns").insert({
            poNo: item.poNo,
            asn_id: asn_id,
            grnUniqueId: UNIQUE_TRANSACTION_ID,
            postingDate: currentDateIST,
            item: JSON.stringify(ITEM),
            documentDate: poDetails.PO_HEADER.DOC_DATE,
            companyCode: poDetails.PO_HEADER.CO_CODE,
            batchNo: poDetails.PO_ITEM_SCHEDULES.BATCH,
            created_at: currentDateIST,
          });

          const updationDataIs2 = await functions.takeSnapShot("asns", asn_id);
          const updateInTable = await knex("asns")
            .update({ grnId: insertGrn })
            .where({ id: asn_id });

          const updateInScr = await knex("asnMaterialReceived")
            .update({ grnId: insertGrn })
            .where({ asn_id: asn_id });

          return {
            UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
            POSTING_DATE: currentDateIST,
            ITEM: ITEM,
            DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
            COMPANY_CODE: poDetails.PO_HEADER.CO_CODE,
            BATCH_NO: `${poDetails.PO_ITEM_SCHEDULES.BATCH}`,
            TIME_STAMP: currentDateIST,
          };
        }
      }
      return null;
    }

    const result = [];
    for (const item of asnRow) {
      const data = await processRow(item);
      if (data) {
        result.push(data);
      }
    }

    const invoicesFromTextract = await knex("invoices_textract")
      .select("sapGrnId", "sapInvoiceId")
      .whereNotNull("sapGrnId");
    if (invoicesFromTextract.length > 0) {
      for (const iterator of invoicesFromTextract) {
        const getInvoiceData = await knex("invoicesToSap").where(
          "id",
          iterator.sapInvoiceId
        );
        if (
          getInvoiceData[0].invoiceCode != null &&
          getInvoiceData[0].invoiceCode != undefined &&
          getInvoiceData[0].invoiceCode != [] &&
          getInvoiceData[0].invoiceCode != "[]"
        ) {
          continue;
        }
        const getData = await knex("grns")
          .where("id", iterator.sapGrnId)
          .whereNull("grnCode")
          .whereNull("grnYear")
          .whereNull("grnItem");

        if (getData.length > 0) {
          const data = {
            UNIQUE_TRANSACTION_ID: getData[0].grnUniqueId,
            POSTING_DATE: getData[0].postingDate,
            ITEM: JSON.parse(getData[0].item),
            DOCUMENT_DATE: getData[0].documentDate,
            COMPANY_CODE: getData[0].companyCode,
            BATCH_NO: getData[0].batchNo,
          };
          result.push(data);
        }
      }
    }
    return res.status(200).json({
      error: false,
      message: "Data fetched successfully",
      data: result,
      total: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record(s).",
      data: error.message,
    });
  }
};

//invoice to sap
// const invoiceToSap = async (req, res) => {

//   const schema = Joi.object({
//     fromDate:Joi.string().allow(""),
//     toDate:Joi.string().allow(""),
//     Days:Joi.number().allow("").default(30)
//   })

//   const {error,value} = schema.validate(req.body)
//   if(error){
//     return res.json({
//       error:true,
//       message:error.details[0].message
//     })
//   }

//   let {fromDate, toDate ,Days} = value

//   if (fromDate && toDate) {
//       fromDate = req.body.fromDate;
//       toDate = req.body.toDate;
//   }else{
//     if(!fromDate && !toDate){
//       fromDate = new Date();
//       toDate = new Date();
//       fromDate.setDate(fromDate.getDate() - Days);

//     }else if (!fromDate && toDate) {
//       toDate = new Date(toDate);
//       fromDate = new Date(toDate);
//       fromDate.setDate(toDate.getDate() - Days);
//   } else if (fromDate && !toDate) {
//     fromDate = new Date(fromDate);
//       toDate = new Date(fromDate);
//       toDate.setDate(fromDate.getDate() + Days);
//   }

//   fromDate = fromDate.toISOString().split('T')[0];
//   toDate = toDate.toISOString().split('T')[0];
//   }

//   const fetchFromASNTimeline = await knex('asnStatusTimeline').where("InvoicedStatus",'=',"Invoiced").whereRaw('DATE(MaterialReceivedTime) BETWEEN ? AND ?', [fromDate, toDate]).select('asn_id')
//   const fetchFromSCRTimeline = await knex('scrStatusTimeline').where("InvoicedStatus",'=',"Invoiced").whereRaw('DATE(acceptedTime) BETWEEN ? AND ?', [fromDate, toDate]).select('asn_id')

//   let idsForASN=[]
//   let idsForSCR=[]
//   fetchFromASNTimeline.forEach((item) => {
//       idsForASN.push(item.asn_id)
//   })

//   fetchFromSCRTimeline.forEach((item) => {
//       idsForSCR.push(item.asn_id)
//   } )

//   const asnRow = await knex("asnMaterialReceived")
//       .whereIn("asn_id",idsForASN)

//   const scrRow = await knex("asns")
//       .whereIn("id",idsForSCR)

//   // const asnRow = await knex("asnMaterialReceived")
//   //   .where("status", "=", "invoiced")
//   //   .andWhere("type", "NB");

//   // const scrRow = await knex("asns")
//   //   .where("status", "=", "invoiced")
//   //   .andWhere("asnNo", "like", "SCR%");

//   const timeis = new Date();

//   let result = [];
//   let result2=[];

//  // const poDetails = await fun.fetchPODetails(poNo);
//   const resultRow = async (item) => {
//    const poDetails = await fun.fetchPODetails(item.poNo);
//     const items = JSON.parse(item.lineItems);
//     let Header = [];
//     let Items = [];
//     items.forEach((i) => {
//       Header.push({
//         postingDate: timeis,
//         documentDate: poDetails.data.data.PO_HEADER.DOC_DATE,
//         reference: '',
//         headerText: poDetails.data.data.PO_HEADER_TEXTS,
//         companyCode: poDetails.data.data.PO_HEADER.CO_CODE,
//         currency: poDetails.data.data.PO_HEADER.CURRENCY,
//         baselineDate: '',
//         totalInvoiceAmount: "",
//         parkPostIndicator: '',
//         taxAmount:''
//       });
//       Items.push({
//         invoiceItemId:"",
//         po:item.poNo,
//         PO_Item:i.poItem,
//         SES:'',
//         TaxCode:'',
//         amaount:'',
//         quantity:i.Quantity,
//         serviceActivity:'',
//         hsnCode:i.hsnCode,
//         plant:'',
//         poUnit:i.unit,
//       });
//     });

//     return {
//       asnNo:item.asnNo,
//       HEADER:Header,
//       ITEM: items,
//       freightConditionCode: '',
//       grnDoc: '',
//       grnDocItem:'',
//       freightAmount:''

//     };
//   };
//   for (const item of asnRow) {
//     const row = await resultRow(item);
//     result.push(row);
//   }

//   for (const item of scrRow) {
//     const row = await resultRow(item);
//     result2.push(row);
//   }

//   return res.json({
//     error: false,
//     message: "Data fetched successfully",
//     data: [...result, ...result2],
//   });
// }

//latest invoiceToSAP
const invoiceToSap = async (req, res) => {
  try {
    const { error, value } = validation.invoiceToSap(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    let { fromDate, toDate, Days } = value;

    if (fromDate && toDate) {
      fromDate = req.body.fromDate;
      toDate = req.body.toDate;
    } else {
      if (!fromDate && !toDate) {
        fromDate = new Date();
        toDate = new Date();
        fromDate.setDate(fromDate.getDate() - Days);
      } else if (!fromDate && toDate) {
        toDate = new Date(toDate);
        fromDate = new Date(toDate);
        fromDate.setDate(toDate.getDate() - Days);
      } else if (fromDate && !toDate) {
        fromDate = new Date(fromDate);
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + Days);
      }

      fromDate = fromDate.toISOString().split("T")[0];
      toDate = toDate.toISOString().split("T")[0];
    }

    const fetchFromASNTimeline = await knex("asnStatusTimeline")
      .where("InvoicedStatus", "=", "Invoiced")
      .whereRaw("DATE(MaterialReceivedTime) BETWEEN ? AND ?", [
        fromDate,
        toDate,
      ])
      .select("asn_id");
    const fetchFromSCRTimeline = await knex("scrStatusTimeline")
      .where("InvoicedStatus", "=", "Invoiced")
      .whereRaw("DATE(acceptedTime) BETWEEN ? AND ?", [fromDate, toDate])
      .select("asn_id");

    let idsForASN = [];
    let idsForSCR = [];
    fetchFromASNTimeline.forEach((item) => {
      idsForASN.push(item.asn_id);
    });

    fetchFromSCRTimeline.forEach((item) => {
      idsForSCR.push(item.asn_id);
    });

    const asnRow = await knex("asnMaterialReceived").whereIn(
      "asn_id",
      idsForASN
    );

    const scrRow = await knex("asns").whereIn("id", idsForSCR);

    // const asnRows = await knex("asnMaterialReceived")
    //   .where("status", "=", "invoiced")
    //   .andWhere("type", "NB");

    // const scrRows = await knex("asns")
    //   .where("status", "=", "invoiced")
    //   .andWhere("asnNo", "like", "SCR%");

    const timeNow = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const result = [];

    const processRow = async (item) => {
      let asn_id;
      if (item.type != "ZSER") {
        asn_id = item.asn_id;
      } else {
        asn_id = item.id;
      }
      const checkInDb = await knex("invoicesToSap")
        .select("header", "items", "poNo", "invoiceUniqueId")
        .where("asn_id", asn_id);
      if (checkInDb.length > 0) {
        return {
          uniqueId: checkInDb[0].invoiceUniqueId,
          poNo: checkInDb[0].poNo,
          Header: JSON.parse(checkInDb[0].header),
          Items: JSON.parse(checkInDb[0].items),
        };
      } else {
        const poNo = item.poNo;
        const poDetails = await fun.fetchPODetails(item.poNo);
        const reference = item.asnNo.slice(3);
        const incomingDate = moment(item.baseLineDate);

        // Convert the date to IST timezone
        const istDate = incomingDate.tz("Asia/Kolkata");

        // Format the date in the desired format
        const baseLineDate = istDate.format("YYYY-MM-DD HH:mm:ss");
        // const baseLineDate = tempDate.toLocaleString("en-IN", options);
        if (poDetails.error != true) {
          const items = JSON.parse(item.lineItems);
          const header = {
            postingDate: timeNow,
            documentDate: poDetails.PO_HEADER.DOC_DATE,
            reference: reference,
            headerText: poDetails.PO_HEADER_TEXTS,
            companyCode: poDetails.PO_HEADER.CO_CODE,
            currency: poDetails.PO_HEADER.CURRENCY,
            baselineDate: baseLineDate,
            totalInvoiceAmount: "",
            parkPostIndicator:
              item.invoiceType == "parkInvoiced" ? "park" : "post",
            parkPostIndicator:
              item.invoiceType == "parkInvoiced" ? "park" : "post",
            taxAmount: "",
          };
          /////////////////////////////////////////////////////
          const headersvalues = JSON.stringify(header);

          const itemsvalues = JSON.stringify(items);
          // console.log("this is po number in processed row", poDetails.PO_NUMBER)

          //////////////////////////////////////////////////////
          let processedItems = [];
          let taxAmount = 0;
          let total = 0;
          let temp = 1;
          items.forEach((i, index) => {
            if (i.Quantity > 0) {
              i.subTotal ? (taxAmount += i.gst) : (taxAmount += 0);
              total += i.subTotal;
              processedItems.push({
                invoiceItemId: temp,
                po: poNo,
                PO_Item: i.poItem || poDetails.PO_ITEMS[0].PO_ITEM.toString(),
                // SES: "",
                amount: i.price,
                TaxCode: poDetails.PO_ITEMS[0].TAX_CODE,
                plant: poDetails.PO_ITEMS[0].PLANT,
                quantity: i.Quantity,
                // serviceActivity: "",
                hsnCode: i.hsnCode,
                poUnit: i.unit,
              });
              temp++;
            }
          });
          header.taxAmount = taxAmount;
          header.totalInvoiceAmount = total;
          const checkPoDetails = await knex("invoicesToSap")
            .where("poNo", poDetails.PO_NUMBER)
            .andWhere("asn_id", asn_id);
          const uniqId = uuidv4();
          if (checkPoDetails.length <= 0) {
            const emptyArray = [];
            const insertPoDetails = await knex("invoicesToSap").insert({
              poNo: poDetails.PO_NUMBER,
              asn_id: asn_id,
              invoiceUniqueId: uniqId,
              invoiceCode: JSON.stringify(emptyArray),
              header: JSON.stringify(header),
              items: JSON.stringify(processedItems),
            });
          }
          return {
            uniqueId: uniqId,
            poNo: poDetails.PO_NUMBER,
            Header: header,
            Items: processedItems,
          };
        }
      }
      // console.log("poDetails:-", poDetails);
    };

    let i = 1;
    for (const item of asnRow) {
      const row = await processRow(item);
      const poNo = row.Items[0].po;
      const checkPoDetails = await knex("invoicesToSap")
        .where("poNo", poNo)
        .andWhere("asn_id", item.asn_id);
      const invoiceCode = JSON.parse(checkPoDetails[0].invoiceCode);
      if (
        checkPoDetails.length > 0 && invoiceCode
          ? invoiceCode.length < row.Items.length
          : true
      ) {
        result.push(row);
      }
    }

    const result2 = [];
    for (const item of scrRow) {
      const row = await processRow(item);
      // console.log(row,"this is row")
      const poNo = row.Items[0].po;
      const checkPoDetails = await knex("invoicesToSap")
        .where("poNo", poNo)
        .andWhere("asn_id", item.id);
      const invoiceCode = JSON.parse(checkPoDetails[0].invoiceCode);
      if (invoiceCode.length < row.Items.length) {
        result2.push(row);
      }
    }
    const invoicesFromTextract = await knex("invoices_textract")
      .select("sapInvoiceId")
      .whereNotNull("sapInvoiceId");
    if (invoicesFromTextract.length > 0) {
      for (const iterator of invoicesFromTextract) {
        const getData = await knex("invoicesToSap").where(
          "id",
          iterator.sapInvoiceId
        );
        if (getData.length > 0) {
          const data = {
            uniqueId: getData[0].invoiceUniqueId,
            poNo: getData[0].poNo,
            Header: JSON.parse(getData[0].header),
            Items: JSON.parse(getData[0].items),
          };
          result.push(data);
        }
      }
    }
    const totalCount = result.length + result2.length;

    return res.status(200).json({
      error: false,
      message: "Data fetched successfully",
      data: [...result, ...result2],
      total: totalCount,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while processing the request.",
    });
  }
};

//main working
// const invoiceToSapNewFormat = async (req, res) => {
//   // try {
//   const schema = Joi.object({
//     fromDate: Joi.string().allow(""),
//     toDate: Joi.string().allow(""),
//     Days: Joi.number().allow("").default(30),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//     });
//   }

//   let { fromDate, toDate, Days } = value;

//   if (fromDate && toDate) {
//     fromDate = req.body.fromDate;
//     toDate = req.body.toDate;
//   } else {
//     if (!fromDate && !toDate) {
//       fromDate = new Date();
//       toDate = new Date();
//       fromDate.setDate(fromDate.getDate() - Days);
//     } else if (!fromDate && toDate) {
//       toDate = new Date(toDate);
//       fromDate = new Date(toDate);
//       fromDate.setDate(toDate.getDate() - Days);
//     } else if (fromDate && !toDate) {
//       fromDate = new Date(fromDate);
//       toDate = new Date(fromDate);
//       toDate.setDate(fromDate.getDate() + Days);
//     }

//     fromDate = fromDate.toISOString().split("T")[0];
//     toDate = toDate.toISOString().split("T")[0];
//   }

//   const fetchFromASNTimeline = await knex("asnStatusTimeline")
//     .where("InvoicedStatus", "=", "Invoiced")
//     .whereRaw("DATE(MaterialReceivedTime) BETWEEN ? AND ?", [fromDate, toDate])
//     .select("asn_id");
//   const fetchFromSCRTimeline = await knex("scrStatusTimeline")
//     .where("InvoicedStatus", "=", "Invoiced")
//     .whereRaw("DATE(acceptedTime) BETWEEN ? AND ?", [fromDate, toDate])
//     .select("asn_id");

//   let idsForASN = [];
//   let idsForSCR = [];
//   fetchFromASNTimeline.forEach((item) => {
//     idsForASN.push(item.asn_id);
//   });

//   fetchFromSCRTimeline.forEach((item) => {
//     idsForSCR.push(item.asn_id);
//   });

//   const asnRow = await knex("asnMaterialReceived").whereIn("asn_id", idsForASN);
//   const scrRow = await knex("asns").whereIn("id", idsForSCR);

//   const timeNow = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//   const result = [];

//   const processRow = async (item) => {
//     let asn_id;
//     if (item.type != "ZSER") {
//       asn_id = item.asn_id;
//     } else {
//       asn_id = item.id;
//     }

//     const checkInDb = await knex("invoicesToSap")
//       .select("header", "items", "poNo")
//       .where("asn_id", asn_id);

//     if (checkInDb.length > 0) {
//       const header = JSON.parse(checkInDb[0].header);
//       const items = JSON.parse(checkInDb[0].items);

//       let data;
//       if (item.type !== "ZSER") {
//         data = { items: items || [], services: {} }; // Set items to empty array if null or undefined
//       } else {
//         data = { items: [], services: {} }; // Initialize items as empty array for ZSER type
//         // Add ZSER specific data to the services object if available
//         data.services = {
//           // Example data, replace with actual ZSER data
//           serviceKey: "serviceValue",
//         };
//       }

//       return {
//         Header: header,
//         ...data,
//       };
//     } else {
//       const poNo = item.poNo;
//       const type = item.type;
//       console.log("type", type);
//       const poDetails = await fun.fetchPODetails(item.poNo);
//       const reference = item.asnNo.slice(3);
//       const incomingDate = moment(item.baseLineDate);

//       // Convert the date to IST timezone
//       const istDate = incomingDate.tz("Asia/Kolkata");

//       // Format the date in the desired format
//       const baseLineDate = istDate.format("YYYY-MM-DD HH:mm:ss");
//       // const baseLineDate = tempDate.toLocaleString("en-IN", options);
//       console.log("this is baselineDate", item.baseLineDate);
//       if (poDetails.error != true) {
//         const items = JSON.parse(item.lineItems);
//         const header = {
//           postingDate: timeNow,
//           // documentDate: poDetails.PO_HEADER.DOC_DATE,
//           reference: reference,
//           // headerText: poDetails.PO_HEADER_TEXTS,
//           // companyCode: poDetails.PO_HEADER.CO_CODE,
//           // currency: poDetails.PO_HEADER.CURRENCY,
//           baselineDate: baseLineDate,
//           totalInvoiceAmount: "",
//           parkPostIndicator:
//             item.invoiceType == "parkInvoiced" ? "park" : "post",
//           parkPostIndicator:
//             item.invoiceType == "parkInvoiced" ? "park" : "post",
//           taxAmount: "",
//         };
//         /////////////////////////////////////////////////////
//         const headersvalues = JSON.stringify(header);

//         const itemsvalues = JSON.stringify(items);
//         // console.log("this is po number in processed row", poDetails.PO_NUMBER)

//         //////////////////////////////////////////////////////
//         let processedItems = [];
//         let taxAmount = 0;
//         let total = 0;
//         let temp = 1;
//         items.forEach((i, index) => {
//           if (i.Quantity > 0) {
//             i.subTotal ? (taxAmount += i.gst) : (taxAmount += 0);
//             total += i.subTotal;
//             processedItems.push({
//               invoiceItemId: temp,
//               po: poNo,
//               // PO_Item: i.poItem || poDetails.PO_ITEMS[0].PO_ITEM.toString(),
//               // SES: "" || poDetails.PO_ITEMS_SERVICES.SERVICE,
//               amount: i.price,
//               // TaxCode: poDetails.PO_ITEMS[0].TAX_CODE,
//               // plant: poDetails.PO_ITEMS[0].PLANT,
//               quantity: i.Quantity,
//               // serviceActivity: "" || poDetails.PO_ITEMS_SERVICES.SHORT_TEXT,
//               hsnCode: i.hsnCode,
//               poUnit: i.unit,
//             });
//             temp++;
//           }
//         });
//         header.taxAmount = taxAmount;
//         header.totalInvoiceAmount = total;
//         const checkPoDetails = await knex("invoicesToSap")
//           .where("poNo", poDetails.PO_NUMBER)
//           .andWhere("asn_id", asn_id);

//         if (checkPoDetails.length <= 0) {
//           const insertPoDetails = await knex("invoicesToSap").insert({
//             poNo: poDetails.PO_NUMBER,
//             asn_id: asn_id,
//             header: JSON.stringify(header),
//             items: JSON.stringify(processedItems),
//           });
//         }
//         return {
//           Header: header,
//           Items: processedItems,
//         };
//       }
//     }
//     // console.log("poDetails:-", poDetails);
//   };

//   let i = 1;
//   for (const item of asnRow) {
//     const row = await processRow(item);
//     const poNo = row.Items[0].po;
//     const checkPoDetails = await knex("invoicesToSap")
//       .where("poNo", poNo)
//       .andWhere("asn_id", item.asn_id);
//     if (checkPoDetails.length > 0 && checkPoDetails[0].invoiceCode == null) {
//       result.push(row);
//     }
//     console.log("po in db", checkPoDetails);
//   }

//   const result2 = [];
//   for (const item of scrRow) {
//     const row = await processRow(item);
//     // console.log(row,"this is row")
//     const poNo = row.Items[0].po;
//     const checkPoDetails = await knex("invoicesToSap")
//       .where("poNo", poNo)
//       .andWhere("asn_id", item.id);
//     if (checkPoDetails[0].invoiceCode == null) {
//       result2.push(row);
//     }
//   }
//   const totalCount = result.length + result2.length;

//   return res.json({
//     error: false,
//     message: "Data fetched successfully",
//     data: [...result, ...result2],
//     total: totalCount,
//   });
//   // } catch (error) {
//   //   console.error("Error:", error);
//   //   return res.json({
//   //     error: true,
//   //     message: "An error occurred while processing the request.",
//   //   });
//   // }
// };

//new format. working
const invoiceToSapNewFormat = async (req, res) => {
  try {
    const { error, value } = validation.invoiceToSapNew(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    let { fromDate, toDate, Days } = value;

    if (fromDate && toDate) {
      fromDate = req.body.fromDate;
      toDate = req.body.toDate;
    } else {
      if (!fromDate && !toDate) {
        fromDate = new Date();
        toDate = new Date();
        fromDate.setDate(fromDate.getDate() - Days);
      } else if (!fromDate && toDate) {
        toDate = new Date(toDate);
        fromDate = new Date(toDate);
        fromDate.setDate(toDate.getDate() - Days);
      } else if (fromDate && !toDate) {
        fromDate = new Date(fromDate);
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + Days);
      }

      fromDate = fromDate.toISOString().split("T")[0];
      toDate = toDate.toISOString().split("T")[0];
    }

    const fetchFromASNTimeline = await knex("asnStatusTimeline")
      .where("InvoicedStatus", "=", "Invoiced")
      .whereRaw("DATE(MaterialReceivedTime) BETWEEN ? AND ?", [
        fromDate,
        toDate,
      ])
      .select("asn_id");
    const fetchFromSCRTimeline = await knex("scrStatusTimeline")
      .where("InvoicedStatus", "=", "Invoiced")
      .whereRaw("DATE(acceptedTime) BETWEEN ? AND ?", [fromDate, toDate])
      .select("asn_id");

    let idsForASN = fetchFromASNTimeline.map((item) => item.asn_id);
    let idsForSCR = fetchFromSCRTimeline.map((item) => item.asn_id);

    const asnRow = await knex("asnMaterialReceived").whereIn(
      "asn_id",
      idsForASN
    );
    const scrRow = await knex("asns").whereIn("id", idsForSCR);

    const timeNow = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const result = [];

    const processRow = async (item) => {
      let asn_id = item.type !== "ZSER" ? item.asn_id : item.id;

      const checkInDb = await knex("invoicesToSap")
        .select("header", "items", "poNo", "invoiceUniqueId")
        .where("asn_id", asn_id);

      const checkInGrnTable = await knex("grns")
        .select("grnCode", "grnYear", "grnItem", "grnStatus")
        .where("asn_id", asn_id)
        .andWhere("poNo", checkInDb[0].poNo);

      console.log("grntable", checkInGrnTable);
      if (checkInDb.length > 0) {
        const poNo = checkInDb[0].poNo;
        const uniqId = checkInDb[0].invoiceUniqueId;

        const header = JSON.parse(checkInDb[0].header);
        const items = JSON.parse(checkInDb[0].items);
        let grnCode, grnYear, grnItem;

        if (checkInGrnTable.length > 0 && checkInGrnTable[0].grnCode !== null) {
          grnCode = checkInGrnTable[0].grnCode;
          grnYear = checkInGrnTable[0].grnYear;
          grnItem = JSON.parse(checkInGrnTable[0].grnItem);
        } else {
          grnCode = "";
          grnYear = "";
          grnItem = [];
        }

        const data =
          item.type !== "ZSER"
            ? {
                poNo: poNo,
                uniqueId: uniqId,
                header: header,
                items: items.map(({ po, ...rest }) => ({
                  ...rest,
                  grnDoc: grnCode,
                  grnDocYear: grnYear,
                  grnDocItem: grnItem,
                })),
                frieght: {
                  freightConditionCode: "",
                  poItem: items[0].PO_Item,
                  grnDoc: grnCode,
                  grnDocYear: grnYear,
                  grnDocItem: grnItem,
                  taxCode: items[0].TaxCode,
                  frieghtAmount: "",
                  Quantity: "",
                },
              }
            : {
                poNo: poNo,
                uniqueId: uniqId,
                header: header,
                items: items.map(({ po, ...rest }) => ({
                  ...rest,
                  SES: "",
                  serviceActivity: "",
                })),
              };

        delete header.asnNo;
        delete header.status;

        return { ...data };
      } else {
        const poNo = item.poNo;
        const poDetails = await fun.fetchPODetails(item.poNo);
        const reference = item.poNo;
        const incomingDate = moment(item.baseLineDate);

        // Convert the date to IST timezone
        const istDate = incomingDate.tz("Asia/Kolkata");

        // Format the date in the desired format
        const baseLineDate = istDate.format("YYYY-MM-DD HH:mm:ss");

        if (poDetails.error != true) {
          const items = JSON.parse(item.lineItems);
          const header = {
            postingDate: timeNow,
            documentDate: poDetails.PO_HEADER.DOC_DATE,
            reference: poNo,
            headerText: poDetails.PO_HEADER_TEXTS,
            companyCode: poDetails.PO_HEADER.CO_CODE,
            currency: poDetails.PO_HEADER.CURRENCY,
            baselineDate: item.baselineDate,
            totalInvoiceAmount: "",
            parkPostIndicator:
              item.invoiceType == "parkInvoiced" ? "park" : "post",
            taxAmount: "",
          };

          const processedItems = [];
          let taxAmount = 0;
          let total = 0;
          let temp = 1;
          items.forEach((i, index) => {
            if (i.Quantity > 0) {
              i.subTotal ? (taxAmount += i.gst) : (taxAmount += 0);
              total += i.subTotal;
              processedItems.push({
                invoiceItemId: temp,
                po: poNo,
                PO_Item: i.poItem || poDetails.PO_ITEMS[0].PO_ITEM.toString(),
                amount: i.price,
                TaxCode: poDetails.PO_ITEMS[0].TAX_CODE,
                plant: poDetails.PO_ITEMS[0].PLANT,
                quantity: i.Quantity,
                hsnCode: i.hsnCode,
                poUnit: i.unit,
              });
              temp++;
            }
          });
          header.taxAmount = taxAmount;
          header.totalInvoiceAmount = total;
          const checkPoDetails = await knex("invoicesToSap")
            .where("poNo", poDetails.PO_NUMBER)
            .andWhere("asn_id", asn_id);
          const uniqId = uuidv4();
          if (checkPoDetails.length <= 0) {
            const emptyArray = [];
            await knex("invoicesToSap").insert({
              poNo: poDetails.PO_NUMBER,
              invoiceUniqueId: uniqId,
              asn_id: asn_id,
              invoiceCode: JSON.stringify(emptyArray),
              header: JSON.stringify(header),
              items: JSON.stringify(processedItems),
            });
          }

          const data =
            item.type !== "ZSER"
              ? {
                  poNo: poNo,
                  uniqueId: uniqId,
                  header: header,
                  items: items.map(({ po, ...rest }) => ({
                    ...rest,
                    SES: "",
                    serviceActivity: "",
                  })),
                }
              : {
                  poNo: poNo,
                  uniqueId: uniqId,
                  header: header,
                  items: items.map(({ po, ...rest }) => ({
                    ...rest,
                    SES: "",
                    serviceActivity: "",
                  })),
                };

          delete header.asnNo;
          delete header.status;

          return { ...data };
        }
      }
    };

    for (const item of asnRow) {
      const row = await processRow(item);
      result.push(row);
    }

    const result2 = [];
    for (const item of scrRow) {
      const row = await processRow(item);
      result2.push(row);
    }

    const invoicesFromTextract = await knex("invoices_textract")
      .select("sapInvoiceId", "poType")
      .whereNotNull("sapInvoiceId");
    if (invoicesFromTextract.length > 0) {
      for (const iterator of invoicesFromTextract) {
        const getData = await knex("invoicesToSap").where(
          "id",
          iterator.sapInvoiceId
        );
        if (getData.length > 0) {
          if (iterator.poType != "ZSER") {
            const Items = JSON.parse(getData[0].items);
            const frieght = {
              freightConditionCode: "",
              poItem: Items[0].PO_Item,
              grnDoc: "",
              grnDocYear: "",
              grnDocItem: "",
              taxCode: Items[0].TaxCode,
              frieghtAmount: "",
              Quantity: "",
            };
            const data = {
              uniqueId: getData[0].invoiceUniqueId,
              poNo: getData[0].poNo,
              header: JSON.parse(getData[0].header),
              items: JSON.parse(getData[0].items),
              frieght: frieght,
            };
            result.push(data);
          } else {
            const data = {
              uniqueId: getData[0].invoiceUniqueId,
              poNo: getData[0].poNo,
              Header: JSON.parse(getData[0].header),
              Items: JSON.parse(getData[0].items),
            };
            result2.push(data);
          }
        }
      }
    }

    const totalCount = result.length + result2.length;
    const responseData = {
      error: false,
      message: "Data fetched successfully",
      data: {
        materials: result,
        services: result2,
      },
      total: totalCount,
    };

    return res.status(200).json({
      error: false,
      message: "Data fetched successfully",
      responseData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Could not fetch record(s)" });
  }
};

const insertGRNCode = async (req, res) => {
  // try {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Token is required.",
    });
  }

  const { jwtConfig } = constant;
  const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
  const statusChanger = payload.permissions[0];
  const statusChangerId = payload.id;
  const { grnUniqueId, grnStatus, grnCode, grnYear, grnItem, basedUpon } =
    req.body;

  const createNotification = async (sapUser, supplier, poNo, asnNo) => {
    const msg =
      asnNo != null
        ? `GRN code ${grnCode} has been assigned for ASN No: ${asnNo} of Purchase Order: ${poNo}.`
        : `GRN code has been assigned for Purchase Order: ${poNo}.`;

    const createNotification = await notification.createNotification(
      sapUser,
      "GRN Code Assigned",
      msg,
      "0"
    );

    const supplierMsg =
      asnNo != null
        ? `GRN code ${grnCode} has been generated for ASN No: ${asnNo} of Purchase Order: ${poNo}.`
        : `GRN code has been assigned for Purchase Order: ${poNo}.`;

    const createSupplierNotification = await notification.createNotification(
      supplier,
      "GRN Code Generated",
      supplierMsg,
      "0"
    );
  };

  const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
  if (basedUpon == "gi") {
    const getDetailsFromGI = await knex("gis").where("giUniqueId", grnUniqueId);
    if (getDetailsFromGI.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "No GI Found for this Unique ID.",
        data: getDetailsFromGI,
      });
    }
    const getSupplierId = await knex("users")
      .select("id")
      .where("email", "=", function () {
        this.select("emailId")
          .from("supplier_details")
          .where("sap_code", getDetailsFromGI[0].vendor)
          .limit(1);
      })
      .first();
    if (getDetailsFromGI[0].asnId == null) {
      const updateGRN = await knex("grns")
        .update({
          grnCode: grnCode,
          grnStatus: grnStatus,
          grnYear: grnYear,
          grnTime: currentDateIST,
          grnItem: JSON.stringify(grnItem),
        })
        .where("grnUniqueId", grnUniqueId);

      if (!updateGRN) {
        return res.status(200).json({
          error: false,
          message: "GRN created and grn code stored in portal.",
          data: updateGRN,
        });
      }
      const data = createNotification(
        statusChangerId,
        getSupplierId.id,
        getDetailsFromGI[0].poNo,
        null
      );

      return res.status(200).json({
        error: false,
        message: "GRN created and grn code stored in portal.",
        data: updateGRN,
      });
    }
    const getASN = await knex("asnMaterialReceived").where(
      "asn_id",
      getDetailsFromGI[0].asnId
    );
    if (getASN.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "ASN not found for this Unique GRN Number.",
      });
    }
    getASN[0].lineItems = JSON.parse(getASN[0].lineItems);
    const getGRNId = await sap.grn(getASN[0]);
    if (getGRNId.error) {
      return res.status(500).json({
        error: true,
        message: `GRN not created. ${getGRNId.message}`,
      });
    }
    // const currentDateIST = moment
    //   .tz("Asia/Kolkata")
    //   .format("YYYY-MM-DD HH:mm:ss");
    const insertGRNCOde = await knex("grns")
      .update({
        grnCode: grnCode,
        grnStatus: grnStatus,
        grnYear: grnYear,
        grnTime: currentDateIST,
        grnItem: JSON.stringify(grnItem),
      })
      .where("grnUniqueId", getGRNId.data);
    if (insertGRNCOde <= 0) {
      return res.status(500).json({
        error: true,
        message: "GRN created but GRN code not inserted.",
        data: getGRNId.data,
      });
    }

    return res.status(200).json({
      error: false,
      message: "GRN created and grn code stored in portal.",
      data: getGRNId.data,
    });
  }

  const getDetailsFromGRN = await knex("grns").where(
    "grnUniqueId",
    grnUniqueId
  );
  if (getDetailsFromGRN.length <= 0) {
    return res.status(404).json({
      error: true,
      message: "No GRN Found for this Unique ID.",
      data: getDetailsFromGRN,
    });
  }

  const getAsnDetailsFromGRN = await knex("grns")
    .where("grnUniqueId", grnUniqueId)
    .whereNull("grnCode");
  if (getAsnDetailsFromGRN.length <= 0) {
    return res.status(409).json({
      error: true,
      message: "GRN Code and Status Already Inserted.",
      data: getAsnDetailsFromGRN,
    });
  }
  // const getAsnDetails = await knex("asns")
  //   .where("id", getAsnDetailsFromGRN[0].asn_id)
  //   .andWhere("grnId", getAsnDetailsFromGRN[0].id)
  //   .andWhere("poNo", poNo);

  // if (getAsnDetails.length <= 0) {
  //   return res.json({
  //     error: true,
  //     message: "ASN not found for this Unique GRN Number.",
  //   });
  // }
  // const currentDateIST = moment
  //   .tz("Asia/Kolkata")
  //   .format("YYYY-MM-DD HH:mm:ss");
  // const getId = await knex("grns")
  //   .where("grnUniqueId", grnUniqueId)
  //   .select("id");

  const update = await knex("grns")
    .update({
      grnCode: grnCode,
      grnStatus: grnStatus,
      grnYear: grnYear,
      grnTime: currentDateIST,
      grnItem: JSON.stringify(grnItem),
    })
    .where("grnUniqueId", grnUniqueId);
  if (update) {
    return res.status(200).json({
      error: false,
      message: "GRN Code inserted successfully.",
    });
  }
  // const updationDataIs = await functions.takeSnapShot("grns", getId.id);
  return res.status(500).json({
    error: true,
    message: "GRN Code not updated.",
  });
  // } catch (error) {
  //   console.log(error)
  //   return res.json({
  //     error: true,
  //     message: "An error occurred while processing the request.",
  //     // data: JSON.stringfy(error),
  //   });
  // }
};

// const sapToInvoiceCode = async (req, res) => {
//   const schema = Joi.object({
//     invoiceCode: Joi.string().required(),
//     uniqueId: Joi.string().required(),
//     poNo: Joi.string().required(),
//     indicator:Joi.string().required()
//   });

//   const { error, value } = schema.validate(req.body);

//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//     });
//   }
//   const { invoiceCode, poNo,uniqueId,indicator} = value;

//   const checkInvoiceCode = await knex("invoicesToSap")
//     .where("poNo", poNo).andWhere("invoiceUniqueId",uniqueId)
//     // .whereNotNull("invoiceCode");
//   if (checkInvoiceCode.length <= 0) {
//     return res.json({
//       error: true,
//       message: "No invoice found for this Unique Id and PO",
//     });
//   }

//   const oldInvoiceCode = JSON.parse(checkInvoiceCode[0].invoiceCode);
//   const oldItems = JSON.parse(checkInvoiceCode[0].items)
//   if(oldInvoiceCode.length >= oldItems.length ){
//     return res.json({
//       error: true,
//       message: "Invoice code already set for all items",
//     });
//   }
//   const newInvoiceCode = [...oldInvoiceCode, invoiceCode];

//   if(req.body.indicator=="park"){
//     const result = await knex("invoicesToSap")
//     .where("poNo", poNo).andWhere("invoiceUniqueId", uniqueId)
//     .update("invoiceCode", JSON.stringify(newInvoiceCode));

//   if (!result) {
//     return res.json({
//       error: true,
//       message: "Invoice code not set",
//     });
//   }
//   }
//   if(req.body.indicator==="post"){
//     const result = await knex("invoicesToSap")
//     .where("poNo", poNo).andWhere("invoiceUniqueId", uniqueId)
//     .update("invoiceCode", JSON.stringify(newInvoiceCode));

//   if (!result) {
//     return res.json({
//       error: true,
//       message: "Invoice code not set",
//     });
//   }
//   }

//   return res.json({
//     error: false,
//     message: "Invoice code set successfully",
//   });
// };

const sapToInvoiceCode = async (req, res) => {
  const { error, value } = validation.sapToInvoiceCode(req.body);

  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { invoiceCode, poNo, uniqueId, indicator } = value;

  const checkInvoiceCode = await knex("invoicesToSap")
    .where("poNo", poNo)
    .andWhere("invoiceUniqueId", uniqueId);

  if (checkInvoiceCode.length <= 0) {
    return res.status(404).json({
      error: true,
      message: "No invoice found for this Unique Id and PO",
    });
  }

  const oldInvoiceCode = JSON.parse(checkInvoiceCode[0].park || "[]");
  const oldItems = JSON.parse(checkInvoiceCode[0].items);

  if (oldInvoiceCode.length >= oldItems.length) {
    return res.status(409).json({
      error: true,
      message: "Invoice code already set for all items",
    });
  }

  const newInvoiceCode = [...oldInvoiceCode, invoiceCode];
  let columnName;

  if (indicator === "park") {
    columnName = "park";
  } else if (indicator === "post") {
    columnName = "post";

    if (checkInvoiceCode[0].post) {
      return res.status(409).json({
        error: true,
        message: "Invoice code already set for post",
      });
    }
  } else {
    return res.status(400).json({
      error: true,
      message: "Invalid indicator value",
    });
  }
  const getId = await knex("invoicesToSap")
    .where("poNo", poNo)
    .andWhere("invoiceUniqueId", uniqueId)
    .first();

  const updationDataIs = await functions.takeSnapShot(
    "invoicesToSap",
    getId.id
  );

  const result = await knex("invoicesToSap")
    .where("poNo", poNo)
    .andWhere("invoiceUniqueId", uniqueId)
    .update(columnName, JSON.stringify(newInvoiceCode));

  if (!result) {
    return res.status(500).json({
      error: true,
      message: "Invoice code not set",
    });
  }

  return res.status(200).json({
    error: false,
    message: "Invoice code set successfully",
  });
};

const insertInvoiceCode = async (req, res) => {
  try {
    const { error, value } = validation.insertInvoiceCode(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { invoiceCode, poNo, uniqueId, indicator } = value;

    const checkInvoiceCode = await knex("invoicesToSap")
      .where("poNo", poNo)
      .andWhere("invoiceUniqueId", uniqueId);

    if (checkInvoiceCode.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "No invoice found for this Unique Id and PO",
      });
    }

    const oldInvoiceCode = JSON.parse(checkInvoiceCode[0].invoiceCode || "[]");

    if (indicator === "post") {
      const checkInvoiceCode = await knex("invoicesToSap")
        .whereNull("postInvoiceCode")
        .andWhere("poNo", poNo)
        .andWhere("invoiceUniqueId", uniqueId);
      if (checkInvoiceCode.length <= 0) {
        return res.status(404).json({
          error: true,
          message:
            "No invoice found for this Unique Id and PO or Invoice Code already Inserted.",
        });
      }

      const getId = await knex("invoicesToSap").where("poNo", poNo).first();
      const updationDataIs = await functions.takeSnapShot(
        "invoicesToSap",
        getId.id
      );
      const insertPostInvoiceCode = await knex("invoicesToSap")
        .update({ postInvoiceCode: invoiceCode })
        .where("poNo", poNo)
        .andWhere("invoiceUniqueId", uniqueId);
      if (!insertPostInvoiceCode) {
        return res.status(500).json({
          error: true,
          message: "Failed to insert Invoice Code.",
        });
      }
      return res.status(200).json({
        error: false,
        message: "Invoice Code inserted successfully.",
      });
    } else if (indicator === "park") {
      const newInvoiceCode = [...oldInvoiceCode, invoiceCode];

      const getId = await knex("invoicesToSap").where("poNo", poNo).first();

      const updationDataIs = await functions.takeSnapShot(
        "invoicesToSap",
        getId.id
      );

      const insertPostInvoiceCode = await knex("invoicesToSap")
        .update({ invoiceCode: JSON.stringify(newInvoiceCode) })
        .where("poNo", poNo)
        .andWhere("invoiceUniqueId", uniqueId);
      if (!insertPostInvoiceCode) {
        return res.status(500).json({
          error: true,
          message: "Failed to insert Invoice Code.",
        });
      }

      return res.status(200).json({
        error: false,
        message: "Invoice Code inserted successfully.",
      });
    } else {
      return res.status(400).json({
        error: true,
        message: "Invalid indicator value",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Could not insert record",
    });
  }
};

const listAllInvoice = async (req, res) => {
  try {
    const tableName = "invoicesToSap";
    const searchFrom = ["poNo", "invoiceCode"];

    const { error, value } = validation.listAllInvoice(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { offset, limit, sort, order, status, search, filter, type } = value;
    console.log(value);

    let getInvoice = knex(tableName);

    getInvoice = getInvoice.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);

          // Add search within the 'header' JSON field
          this.orWhere(function () {
            this.whereRaw(
              `LOWER(JSON_EXTRACT(header, '$.parkPostIndicator')) LIKE ?`,
              `%${search.toLowerCase()}%`
            );
          });
        });
      }
    });
    if (type !== undefined && type !== "") {
      getInvoice.whereRaw(
        `LOWER(JSON_EXTRACT(header, '$.parkPostIndicator')) LIKE ?`,
        `%${type}%`
      );
    }
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        // const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        const endDateISO = endDateObj.toISOString();
        getInvoice.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }
    console.log(getInvoice.toQuery());
    const total = await getInvoice.clone().count("id as total").first();
    console.log(total);
    getInvoice = await getInvoice
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset);
    if (!getInvoice || getInvoice.length === 0) {
      return res.status(404).json({
        error: true,
        message: "No data found",
      });
    }

    const parsedInvoices = getInvoice.map((invoice, index) => {
      const header = JSON.parse(invoice.header);
      const items = JSON.parse(invoice.items);
      return {
        srNo: index + 1, // Serial number for the invoice
        poNo: invoice.poNo,
        asnId: invoice.asn_id,
        invoiceCode: invoice.invoiceCode,
        park: invoice.park,
        post: invoice.post,
        header,
        items,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      };
    });

    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully",
      data: parsedInvoices,
      total: total.total,
      // total: parsedInvoices.length,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not load record(s)",
        data: JSON.stringify(error.message),
      })
      .end();
  }
};

const viewInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch the invoice with the provided ID from the database
    const invoice = await knex("invoicesToSap").where({ id }).first();

    // Check if the invoice exists
    if (!invoice) {
      return res.status(404).json({
        error: true,
        message: "Invoice not found",
      });
    }

    // // Parse the header and items JSON strings
    // const header = JSON.parse(invoice.header);
    // const items = JSON.parse(invoice.items);

    // Prepare the response object
    const parsedInvoice = {
      id: invoice.id,
      poNo: invoice.poNo,
      asnId: invoice.asn_id,
      invoiceUniqueId: invoice.invoiceUniqueId,
      invoiceCode: invoice.invoiceCode,
      header: JSON.parse(invoice.header),
      items: JSON.parse(invoice.items),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    return res.status(200).json({
      error: false,
      message: "Invoice retrieved successfully",
      data: parsedInvoice,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record",
      data: error.message,
    });
  }
};

const SEStoSAP = async (req, res) => {
  try {
    const { error, value } = validation.SEStoSAP(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    let { fromDate, toDate, Days } = value;

    if (fromDate && toDate) {
      fromDate = req.body.fromDate;
      toDate = req.body.toDate;
    } else {
      if (!fromDate && !toDate) {
        fromDate = new Date();
        toDate = new Date();
        fromDate.setDate(fromDate.getDate() - Days);
      } else if (!fromDate && toDate) {
        toDate = new Date(toDate);
        fromDate = new Date(toDate);
        fromDate.setDate(toDate.getDate() - Days);
      } else if (fromDate && !toDate) {
        fromDate = new Date(fromDate);
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + Days);
      }

      fromDate = fromDate.toISOString().split("T")[0];
      toDate = toDate.toISOString().split("T")[0];
    }

    const fetchFromSCRTimeline = await knex("scrStatusTimeline")
      .where("acceptedStatus", "Accepted")
      .whereRaw("DATE(acceptedTime) BETWEEN ? AND ?", [fromDate, toDate])
      .select("asn_id");

    const idsForSCR = [];

    for (const iterator of fetchFromSCRTimeline) {
      idsForSCR.push(iterator.asn_id);
    }

    const asnRow = await knex("asns").whereIn("id", idsForSCR);

    async function processRow(item) {
      const checkInDb = await knex("ses")
        .select(
          "sesUniqueId as UNIQUE_TRANSACTION_ID",
          "poNo",
          "header",
          "item",
          "sesCode",
          "sesStatus"
        )
        .where({ asnId: item.id });

      if (checkInDb.length > 0) {
        if (checkInDb[0].sesCode == null || checkInDb[0].sesStatus == null) {
          const item = JSON.parse(checkInDb[0].item);
          const header = JSON.parse(checkInDb[0].header);
          const UNIQUE_TRANSACTION_ID = uuidv4();
          const currentDateIST = moment
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss");
          return {
            error: false,
            UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
            poNo: checkInDb[0].poNo,
            header,
            item,
            TIME_STAMP: currentDateIST,
          };
        }
        return {
          error: true,
        };
      } else {
        const poDetails = await fun.fetchPODetails(item.poNo);
        if (!poDetails.error) {
          const items = JSON.parse(item.lineItems);
          let ITEM = [];
          const currentDateIST = moment
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss");
          const header = {
            SERVICE_ENTERY_SHEET: "",
            SHORT_TEXT: "service",
            PURCHASING_DOCUMENT: "",
            ITEM: "",
            DOCUMENT_DATE: item.dispatchDate,
            POSTING_DATE: item.dispatchDate,
            REFERENCE: item.poNo,
            DOCUMENT_HEADER_TEXT: poDetails.PO_HEADER_TEXTS,
            GROSS_VALUE: 0,
            INVOICE_NUMBER: "",
            INVOICE_DATE: "",
          };
          const UNIQUE_TRANSACTION_ID = uuidv4();
          let temp = 1;
          let total = 0;
          items.forEach((i) => {
            if (i.Quantity > 0) {
              ITEM.push({
                ACTIVITY_NUMBER: temp,
                LINE_NUMBER: temp,
                SHORT_TEXT: i.serviceName,
                QUANTITY: i.Quantity,
                UOM: i.unit,
                NET_VALUE: i.price,
                GROSS_PRICE: i.price + i.gst,
                TAX_CODE: i.poItem,
                TAX_TARRIF_CODE: item.poNo,
              });
              temp++;
              total += i.subTotal;
            }
          });
          header.GROSS_VALUE = total;
          const insertSes = await knex("ses").insert({
            poNo: item.poNo,
            asnId: item.id,
            sesUniqueId: UNIQUE_TRANSACTION_ID,
            header: JSON.stringify(header),
            item: JSON.stringify(ITEM),
            createdAt: currentDateIST,
          });

          const updationDataIs = await functions.takeSnapShot("asns", item.id);

          const updateInTable = await knex("asns")
            .update({ sesId: insertSes })
            .where({ id: item.id });

          return {
            UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
            poNo: item.poNo,
            header,
            item,
            TIME_STAMP: currentDateIST,
          };
        }
        return {
          error: true,
        };
      }
      return null;
    }

    const result = [];
    for (const item of asnRow) {
      const data = await processRow(item);
      if (data.error === false) {
        delete data.error;
        result.push(data);
      }
    }

    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully",
      data: result,
      total: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not retrive",
      data: error.message,
    });
  }
};

const removeGRNCode = async (req, res) => {
  try {
    const { error, value } = validation.removeGRNCode(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { grnUniqueId } = value;

    const getId = await knex("grns").where({ grnUniqueId }).first();

    const updationDataIs = await functions.takeSnapShot("grns", getId.id);

    const update = await knex("grns")
      .update({ grnCode: null, grnStatus: null })
      .where({ grnUniqueId });
    if (update) {
      return res.status(200).json({
        error: false,
        message: "GRN Code removed successfully",
      });
    }

    return res.status(500).json({
      error: true,
      message: "Failed to delete GRN Code.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete",
      data: error.message,
    });
  }
};

const updateGRNCode = async (req, res) => {
  try {
    const { error, value } = validation.updateGRNCode(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { grnUniqueId, grnCode } = value;

    const getId = await knex("grns").where({ grnUniqueId }).first();

    const updationDataIs = await functions.takeSnapShot("invoices", getId.id);

    const update = await knex("grns")
      .update({ grnCode, grnStatus: "GRN Generated" })
      .where({ grnUniqueId });

    if (update) {
      return res.status(200).json({
        error: false,
        message: "GRN Code updated successfully",
      });
    }

    return res.status(500).json({
      error: true,
      message: "Failed to update GRN Code.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record",
      data: error.message,
    });
  }
};

const paginateGrn = async (req, res) => {
  try {
    const tableName = "grns";
    const searchFrom = ["poNo", "grnUniqueId", "grnCode", "asn_id"];
    const { error, value } = validation.paginateGrn(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let {
      offset,
      limit,
      order,
      sort,
      search,
      status,
      grnCodeExists,
      asnIdExists,
      filter,
    } = value;
    let results = knex(tableName);
    if (status != undefined && status != "") {
      total = results.where("status", status);
    }
    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
      if (grnCodeExists !== undefined) {
        if (grnCodeExists) {
          this.whereNotNull("grnCode");
        } else {
          this.whereNull("grnCode");
        }
      }
      if (asnIdExists !== undefined) {
        if (asnIdExists) {
          this.whereNotNull("asn_id");
        } else {
          this.whereNull("asn_id");
        }
      }
    });
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        if (dateField === "postingDate" || dateField === "documentDate") {
          const startDateISO = startDate.toISOString().split("T")[0];
          const endDateISO = endDate.toISOString().split("T")[0];
          results.whereBetween(dateField, [startDateISO, endDateISO]);
        } else {
          const startDateISO = new Date(startDate).toISOString();
          // const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          const endDateISO = endDateObj.toISOString();
          results.whereBetween(dateField, [startDateISO, endDateISO]);
        }
      }
    }
    total = await results.count("id as total").first();
    let rows = knex(tableName);

    if (status != undefined && status != "") {
      rows.where("status", status);
    }
    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
      if (grnCodeExists !== undefined) {
        if (grnCodeExists) {
          this.whereNotNull("grnCode");
        } else {
          this.whereNull("grnCode");
        }
      }
      if (asnIdExists !== undefined) {
        if (asnIdExists) {
          this.whereNotNull("asn_id");
        } else {
          this.whereNull("asn_id");
        }
      }
    });
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        if (dateField === "postingDate" || dateField === "documentDate") {
          const startDateISO = startDate.toISOString().split("T")[0];
          const endDateISO = endDate.toISOString().split("T")[0];
          rows.whereBetween(dateField, [startDateISO, endDateISO]);
        } else {
          const startDateISO = new Date(startDate).toISOString();
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          const endDateISO = endDateObj.toISOString();

          rows.whereBetween(dateField, [startDateISO, endDateISO]);
        }
      }
    }

    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

    rows = rows.map((row) => {
      row.item = JSON.parse(row.item);
      return row;
    });

    rows = rows.map((row) => {
      row.grnItem = JSON.parse(row.grnItem);
      return row;
    });

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
      message: "retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record",
      data: JSON.stringify(error.message),
    });
  }
};

//with startdate enddate filter on grnTime
//still need to test
// const paginateGrn = async (req, res) => {
//   try {
//     const tableName = "grns";
//     const searchFrom = ["poNo", "grnUniqueId", "grnCode", "asn_id"];

//     const schema = Joi.object({
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(50),
//       sort: Joi.string().default("id"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
//       status: Joi.string().valid("0", "1", "").default(""),
//       search: Joi.string().allow("", null).default(null),
//       grnCodeExists: Joi.boolean(),
//       asnIdExists: Joi.boolean(),
//       filter: Joi.object({
//         startDate: Joi.date().optional(),
//         endDate: Joi.date().optional()
//       }).optional()
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     let total = 0;

//     let { offset, limit, order, sort, search, status, grnCodeExists, asnIdExists, filter } = value;
//     let results = knex(tableName);
//     if (status != undefined && status != "") {
//       total = results.where("status", status);
//     }
//     results = results.where(function () {
//       if (search != undefined && search != "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//       if (grnCodeExists !== undefined) {
//         if (grnCodeExists) {
//           this.whereNotNull('grnCode');
//         } else {
//           this.whereNull('grnCode');
//         }
//       }
//       if (asnIdExists !== undefined) {
//         if (asnIdExists) {
//           this.whereNotNull('asn_id');
//         } else {
//           this.whereNull('asn_id');
//         }
//       }
//       if (filter && filter.startDate && filter.endDate) {
//         this.whereBetween('grnTime', [filter.startDate, filter.endDate]);
//       }
//     });
//     total = await results.count("id as total").first();
//     let rows = knex(tableName);

//     if (status != undefined && status != "") {
//       rows.where("status", status);
//     }
//     rows = rows.where(function () {
//       if (search != undefined && search != "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//       if (grnCodeExists !== undefined) {
//         if (grnCodeExists) {
//           this.whereNotNull('grnCode');
//         } else {
//           this.whereNull('grnCode');
//         }
//       }
//       if (asnIdExists !== undefined) {
//         if (asnIdExists) {
//           this.whereNotNull('asn_id');
//         } else {
//           this.whereNull('asn_id');
//         }
//       }
//       if (filter && filter.startDate && filter.endDate) {
//         this.whereBetween('grnTime', [filter.startDate, filter.endDate]);
//       }
//     });
//     rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

//     rows = rows.map(row => {
//       row.item = JSON.parse(row.item);
//       return row;
//     });

//     rows = rows.map(row => {
//       row.grnItem = JSON.parse(row.grnItem);
//       return row;
//     });

//     let data_rows = [];
//     if (order === "desc") {
//       let sr = offset + 1;
//       await rows.forEach((row) => {
//         row.sr = sr;
//         delete row.password;
//         data_rows.push(row);
//         sr++;
//       });
//     } else {
//       let sr = total.total - limit * offset;
//       await rows.forEach((row) => {
//         row.sr = sr;
//         delete row.password;
//         data_rows.push(row);
//         sr--;
//       });
//     }
//     return res.status(200).json({
//       error: false,
//       message: total.total === 0 ? "No data available for the provided date range." : "Retrieved successfully.",
//       data: {
//         rows: data_rows,
//         total: total.total,
//       },
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };

export default {
  normalgrn,
  incomingInvoice,
  listInvoice,
  viewInvoice,
  updateInvoice,
  deleteInvoice,
  GRNtoSAP,
  invoiceToSap,
  insertGRNCode,
  sapToInvoiceCode,
  invoiceToSapNewFormat,
  listAllInvoice,
  viewInvoiceById,
  SEStoSAP,
  removeGRNCode,
  updateGRNCode,
  insertInvoiceCode,
  paginateGrn,
};
