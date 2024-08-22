import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import QRCode from "qrcode";
import constant from "../../helpers/constants.js";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import moment from "moment-timezone";
import { constants } from "fs/promises";
import e from "express";
import validation from "../../validation/workflow/invoice.js";

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

    const { error, value } = validation.paginate(req.body);
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
      message: "Could not retrive record(s)",
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
  const { error, value } = validation.update(req.body);
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
  const updationDataIs = await functions.takeSnapShot("invoices", id);

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
  const { error, value } = validation.del(req.params);
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
// const invoiceToSapNewFormat = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       fromDate: Joi.string().allow(""),
//       toDate: Joi.string().allow(""),
//       Days: Joi.number().allow("").default(30),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }

//     let { fromDate, toDate, Days } = value;

//     if (fromDate && toDate) {
//       fromDate = req.body.fromDate;
//       toDate = req.body.toDate;
//     } else {
//       if (!fromDate && !toDate) {
//         fromDate = new Date();
//         toDate = new Date();
//         fromDate.setDate(fromDate.getDate() - Days);
//       } else if (!fromDate && toDate) {
//         toDate = new Date(toDate);
//         fromDate = new Date(toDate);
//         fromDate.setDate(toDate.getDate() - Days);
//       } else if (fromDate && !toDate) {
//         fromDate = new Date(fromDate);
//         toDate = new Date(fromDate);
//         toDate.setDate(fromDate.getDate() + Days);
//       }

//       fromDate = fromDate.toISOString().split("T")[0];
//       toDate = toDate.toISOString().split("T")[0];
//     }

//     const fetchFromASNTimeline = await knex("asnStatusTimeline")
//       .where("InvoicedStatus", "=", "Invoiced")
//       .whereRaw("DATE(MaterialReceivedTime) BETWEEN ? AND ?", [
//         fromDate,
//         toDate,
//       ])
//       .select("asn_id");
//     const fetchFromSCRTimeline = await knex("scrStatusTimeline")
//       .where("InvoicedStatus", "=", "Invoiced")
//       .whereRaw("DATE(acceptedTime) BETWEEN ? AND ?", [fromDate, toDate])
//       .select("asn_id");

//     let idsForASN = fetchFromASNTimeline.map((item) => item.asn_id);
//     let idsForSCR = fetchFromSCRTimeline.map((item) => item.asn_id);

//     const asnRow = await knex("asnMaterialReceived").whereIn(
//       "asn_id",
//       idsForASN
//     );
//     const scrRow = await knex("asns").whereIn("id", idsForSCR);

//     const timeNow = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
//     const result = [];

//     const processRow = async (item) => {
//       let asn_id = item.type !== "ZSER" ? item.asn_id : item.id;

//       const checkInDb = await knex("invoicesToSap")
//         .select("header", "items", "poNo", "invoiceUniqueId")
//         .where("asn_id", asn_id);

//       if (checkInDb.length > 0) {
//         const poNo = checkInDb[0].poNo;
//         const uniqId = checkInDb[0].invoiceUniqueId;

//         const header = JSON.parse(checkInDb[0].header);
//         const items = JSON.parse(checkInDb[0].items);

//         const data =
//           item.type !== "ZSER"
//             ? {
//                 poNo: poNo,
//                 uniqueId: uniqId,
//                 header: header,
//                 items: items.map(({ po, ...rest }) => ({
//                   ...rest,
//                   grnDoc: "",
//                   grnDocYear: "",
//                   grnDocItem: "",
//                   SES: "",
//                   serviceActivity: "",
//                 })),
//                 frieght: {
//                   freightConditionCode: "",
//                   poItem: items[0].PO_Item,
//                   grnDoc: "",
//                   grnDocYear: "",
//                   grnDocItem: "",
//                   taxCode: items[0].TaxCode,
//                   frieghtAmount: "",
//                   Quantity: "",
//                 },
//               }
//             : {
//                 poNo: poNo,
//                 uniqueId: uniqId,
//                 header: header,
//                 items: items.map(({ po, ...rest }) => ({
//                   ...rest,
//                   grnDoc: "",
//                   grnDocYear: "",
//                   grnDocItem: "",
//                   SES: "",
//                   serviceActivity: "",
//                 })),
//               };

//         delete header.asnNo;
//         delete header.status;

//         return { ...data };
//       } else {
//         const poNo = item.poNo;
//         const poDetails = await fun.fetchPODetails(item.poNo);
//         const reference = item.poNo;
//         const incomingDate = moment(item.baseLineDate);

//         // Convert the date to IST timezone
//         const istDate = incomingDate.tz("Asia/Kolkata");

//         // Format the date in the desired format
//         const baseLineDate = istDate.format("YYYY-MM-DD HH:mm:ss");

//         if (poDetails.error != true) {
//           const items = JSON.parse(item.lineItems);
//           const header = {
//             postingDate: item.postingDate?item.postingDate:timeNow,
//             documentDate: poDetails.PO_HEADER.DOC_DATE,
//             reference: poNo,
//             headerText: poDetails.PO_HEADER_TEXTS,
//             companyCode: poDetails.PO_HEADER.CO_CODE,
//             currency: poDetails.PO_HEADER.CURRENCY,
//             baselineDate: item.baselineDate?item.baselineDate:timeNow,
//             totalInvoiceAmount: "",
//             parkPostIndicator:
//               item.invoiceType == "parkInvoiced" ? "park" : "post",
//             taxAmount: "",
//           };

//           const processedItems = [];
//           let taxAmount = 0;
//           let total = 0;
//           let temp = 1;
//           items.forEach((i, index) => {
//             if (i.Quantity > 0) {
//               i.subTotal ? (taxAmount += i.gst) : (taxAmount += 0);
//               total += i.subTotal;
//               processedItems.push({
//                 invoiceItemId: temp,
//                 po: poNo,
//                 PO_Item: i.poItem || poDetails.PO_ITEMS[0].PO_ITEM.toString(),
//                 amount: i.price,
//                 TaxCode: poDetails.PO_ITEMS[0].TAX_CODE,
//                 plant: poDetails.PO_ITEMS[0].PLANT,
//                 quantity: i.Quantity,
//                 hsnCode: i.hsnCode,
//                 poUnit: i.unit,
//               });
//               temp++;
//             }
//           });
//           header.taxAmount = taxAmount;
//           header.totalInvoiceAmount = total;
//           const checkPoDetails = await knex("invoicesToSap")
//             .where("poNo", poDetails.PO_NUMBER)
//             .andWhere("asn_id", asn_id);
//           const uniqId = uuidv4();
//           if (checkPoDetails.length <= 0) {
//             const emptyArray = [];
//             await knex("invoicesToSap").insert({
//               poNo: poDetails.PO_NUMBER,
//               invoiceUniqueId: uniqId,
//               asn_id: asn_id,
//               invoiceCode: JSON.stringify(emptyArray),
//               header: JSON.stringify(header),
//               items: JSON.stringify(processedItems),
//             });
//           }

//           const data =
//             item.type !== "ZSER"
//               ? {
//                   poNo: poNo,
//                   uniqueId: uniqId,
//                   header: header,
//                   items: items.map(({ po, ...rest }) => ({
//                     ...rest,
//                     SES: "",
//                     serviceActivity: "",
//                   })),
//                 }
//               : {
//                   poNo: poNo,
//                   uniqueId: uniqId,
//                   header: header,
//                   items: items.map(({ po, ...rest }) => ({
//                     ...rest,
//                     SES: "",
//                     serviceActivity: "",
//                   })),
//                 };

//           delete header.asnNo;
//           delete header.status;

//           return { ...data };
//         }
//       }
//     };

//     for (const item of asnRow) {
//       const row = await processRow(item);
//       result.push(row);
//     }

//     const result2 = [];
//     for (const item of scrRow) {
//       const row = await processRow(item);
//       result2.push(row);
//     }

//     const invoicesFromTextract = await knex("invoices_textract")
//       .select("sapInvoiceId", "poType")
//       .whereNotNull("sapInvoiceId");
//     if (invoicesFromTextract.length > 0) {
//       for (const iterator of invoicesFromTextract) {
//         const getData = await knex("invoicesToSap").where(
//           "id",
//           iterator.sapInvoiceId
//         );
//         if (getData.length > 0) {
//           if (iterator.poType != "ZSER") {
//             const Items = JSON.parse(getData[0].items);
//             const frieght = {
//               freightConditionCode: "",
//               poItem: Items[0].PO_Item,
//               grnDoc: "",
//               grnDocYear: "",
//               grnDocItem: "",
//               taxCode: Items[0].TaxCode,
//               frieghtAmount: "",
//               Quantity: "",
//             };
//             const data = {
//               uniqueId: getData[0].invoiceUniqueId,
//               poNo: getData[0].poNo,
//               header: JSON.parse(getData[0].header),
//               items: JSON.parse(getData[0].items),
//               frieght: frieght,
//             };
//             result.push(data);
//           } else {
//             const data = {
//               uniqueId: getData[0].invoiceUniqueId,
//               poNo: getData[0].poNo,
//               Header: JSON.parse(getData[0].header),
//               Items: JSON.parse(getData[0].items),
//             };
//             result2.push(data);
//           }
//         }
//       }
//     }

//     const totalCount = result.length + result2.length;
//     const responseData = {
//       error: false,
//       message: "Data fetched successfully",
//       data: {
//         materials: result,
//         services: result2,
//       },
//       total: totalCount,
//     };

//     return res.json(responseData);
//   } catch (error) {
//     return res.json({ error: true, message: "Internal Server Error" });
//   }
// };

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

    const timeNow = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    const result = [];

    const processRow = async (item) => {
      let asn_id = item.type !== "ZSER" ? item.asn_id : item.id;

      const checkInDb = await knex("invoicesToSap")
        .select("header", "items", "poNo", "invoiceUniqueId", "invoiceCode")
        .where("asn_id", asn_id);
      if (checkInDb.length > 0) {
        const invoiceCode = JSON.parse(checkInDb[0].invoiceCode);
        if (invoiceCode.length >= 1) {
          return {
            error: true,
          };
        }
        const poNo = checkInDb[0].poNo;
        const uniqId = checkInDb[0].invoiceUniqueId;

        const header = JSON.parse(checkInDb[0].header);
        const items = JSON.parse(checkInDb[0].items);
        let grnCode, grnYear, grnItem;

        const checkInGrnTable = await knex("grns")
          .select("grnCode", "grnYear", "grnItem", "grnStatus")
          .where("asn_id", asn_id)
          .andWhere("poNo", checkInDb[0].poNo);

        if (checkInGrnTable.length > 0 && checkInGrnTable[0].grnCode !== null) {
          grnCode = checkInGrnTable[0].grnCode;
          grnYear = checkInGrnTable[0].grnYear;
          grnItem = JSON.parse(checkInGrnTable[0].grnItem);
        } else {
          grnCode = "";
          grnYear = "";
          grnItem = [];
        }

        const getSES = await knex("ses")
          .select("sesCode", "serviceActivity", "sesStatus", "item")
          .where("asnId", asn_id);
        const code = [];
        for (const ses of getSES) {
          const item = JSON.parse(ses.item);
          for (const iterator of item) {
            const temp = {
              sesCode: ses.sesCode,
              serviceActivity: ses.serviceActivity,
            };
            code.push(temp);
          }
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
                items: items.map(({ po, ...rest }, index) => ({
                  ...rest,
                  SES: code[index]
                    ? code[index].sesCode != null
                      ? code[index].sesCode
                      : ""
                    : "",
                  serviceActivity: code[index]
                    ? code[index].serviceActivity
                      ? JSON.parse(code[index].serviceActivity)
                      : []
                    : [],
                })),
              };

        delete header.asnNo;
        delete header.status;

        return { ...data };
      } else {
        const poNo = item.poNo;
        const poDetails = await fun.fetchPODetails(item.poNo);
        const incomingDate = item.baseLineDate;

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
            console.log(i, "this is item");
            if (item.type == "ZSER") {
              const temp = poDetails.PO_ITEM_SERVICES[index].PCKG_NO - 1;
              poDetails.PO_ITEMS.map((item, index) => {
                if (item.PCKG_NO == temp) {
                  i.poItem = item.PO_ITEM;
                }
              });
            }
            if (i.Quantity > 0) {
              i.subTotal ? (taxAmount += i.gst) : (taxAmount += 0);
              total += i.subTotal;
              processedItems.push({
                invoiceItemId: temp,
                po: poNo,
                PO_Item: i.poItem
                  ? i.poItem
                  : poDetails.PO_ITEMS[0].PO_ITEM.toString(),
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

          const getSES = await knex("ses")
            .select("sesCode", "serviceActivity", "sesStatus", "item")
            .where("asnId", asn_id);
          const code = [];
          for (const ses of getSES) {
            const item = JSON.parse(ses.item);
            for (const iterator of item) {
              const temp = {
                sesCode: ses.sesCode,
                serviceActivity: ses.serviceActivity,
              };
              code.push(temp);
            }
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
                  items: items.map(({ po, ...rest }, index) => ({
                    ...rest,
                    SES: code[index]
                      ? code[index].sesCode != null
                        ? code[index].sesCode
                        : ""
                      : "",
                    serviceActivity: code[index]
                      ? code[index].serviceActivity
                        ? JSON.parse(code[index].serviceActivity)
                        : []
                      : [],
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
      if (!row.error) {
        result.push(row);
      }
    }

    const result2 = [];
    for (const item of scrRow) {
      const row = await processRow(item);
      if (!row.error) {
        result2.push(row);
      }
    }

    const textractMaterial = [];
    const textractService = [];
    const invoicesFromTextract = await knex("invoices_textract")
      .select("sapInvoiceId", "sapGrnId", "poType")
      .whereNotNull("sapInvoiceId");
    if (invoicesFromTextract.length > 0) {
      for (const iterator of invoicesFromTextract) {
        let getData = await knex("invoicesToSap")
          .where("id", iterator.sapInvoiceId)
          .andWhereRaw("DATE(createdAt) BETWEEN ? AND ?", [fromDate, toDate]);

        if (getData.length > 0) {
          if (
            getData[0].invoiceCode != null &&
            getData[0].invoiceCode != undefined &&
            getData[0].invoiceCode != [] &&
            getData[0].invoiceCode != "[]"
          ) {
            continue;
          }
          if (iterator.poType != "ZSER") {
            const getGRN = await knex("grns").where("id", iterator.sapGrnId);
            const Items = JSON.parse(getData[0].items);
            let temp = 0;
            for (const iterator of Items) {
              (Items[temp].grnDoc = getGRN[0].grnCode),
                (Items[temp].grnDocYear = getGRN[0].grnYear),
                (Items[temp].grnDocItem =
                  getGRN[0].grnItem != null
                    ? JSON.parse(getGRN[0].grnItem)
                    : []);
              temp++;
            }
            const frieght = {
              freightConditionCode: "",
              poItem: Items[0].PO_Item,
              grnDoc: getGRN[0].grnCode,
              grnDocYear: getGRN[0].grnYear,
              grnDocItem:
                getGRN[0].grnItem != null ? JSON.parse(getGRN[0].grnItem) : [],
              taxCode: Items[0].TaxCode,
              frieghtAmount: "",
              Quantity: "",
            };

            getData[0].header = JSON.parse(getData[0].header);

            delete getData[0].header.supplierGST;
            delete getData[0].header.companyGST;
            delete getData[0].header.GST_invoiceNo;

            const data = {
              uniqueId: getData[0].invoiceUniqueId,
              poNo: getData[0].poNo,
              header: getData[0].header,
              items: Items,
              frieght: frieght,
            };
            textractMaterial.push(data);
          } else {
            getData[0].header = JSON.parse(getData[0].header);

            delete getData[0].header.supplierGST;
            delete getData[0].header.companyGST;
            delete getData[0].header.GST_invoiceNo;
            const data = {
              uniqueId: getData[0].invoiceUniqueId,
              poNo: getData[0].poNo,
              Header: getData[0].header,
              Items: JSON.parse(getData[0].items),
            };
            textractService.push(data);
          }
        }
      }
    }

    const totalCount = result.length + result2.length;

    return res.status(200).json({
      error: false,
      message: "Data fetched successfully",
      data: {
        textract: {
          material: textractMaterial,
          service: textractService,
        },
        materials: result,
        services: result2,
      },
      total: totalCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Could not fetch record(s)" });
  }
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

  const getId = await knex("invoicesToSap").where("poNo", poNo).first();

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
      const currentDateIST = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
      const getIds = await knex("invoicesToSap").where("poNo", poNo).first();
      const updationDataIs = await functions.takeSnapShot(
        "invoicesToSap",
        getIds.id
      );
      const insertPostInvoiceCode = await knex("invoicesToSap")
        .update({
          postInvoiceCode: invoiceCode,
          postTime: currentDateIST,
          status:indicator
        })
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
      const currentDateIST = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
      const newInvoiceCode = [...oldInvoiceCode, invoiceCode];

      const getId = await knex("invoicesToSap").where("poNo", poNo).first();

      const updationDataIs = await functions.takeSnapShot(
        "invoicesToSap",
        getId.id
      );

      const insertPostInvoiceCode = await knex("invoicesToSap")
        .update({
          invoiceCode: JSON.stringify(newInvoiceCode),
          parkTime: currentDateIST,
          status:indicator
        })
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
    const getInvoice = await knex("invoicesToSap");

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
      total: parsedInvoices.length,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not retrive",
        data: JSON.stringify(error),
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

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "invoices";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(500).json({
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
      message: "Could not delete record(s)",
      data: JSON.stringify(error),
    });
  }
};

export default {
  incomingInvoice,
  listInvoice,
  viewInvoice,
  updateInvoice,
  deleteInvoice,
  invoiceToSap,
  invoiceToSapNewFormat,
  sapToInvoiceCode,
  insertInvoiceCode,
  listAllInvoice,
  viewInvoiceById,
  delteMultipleRecords,
};
