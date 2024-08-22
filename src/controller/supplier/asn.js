import convert from "convert-units";
import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import QRCode from "qrcode";
import constant from "../../helpers/constants.js";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import po from "../../../src/services/poFromSap.js";
import moment from "moment-timezone";
import masterIndiaService from "../../services/masterIndia-service.js";
import functions from "../../helpers/functions.js";
import path from "path";
import sap from "../../helpers/sap.js";
import ses from "../../helpers/ses.js";
import constants from "../../helpers/constants.js";
import notification from "../notification.js";
import { getType } from "pdf-lib";
import validation from "../../validation/supplier/asn.js";

import logs from "../../middleware/logs.js";
function stringToDate(dateString) {
  console.log("mydate:=", dateString);
  const [day, month, year] = dateString.split("-").map(Number);

  // Create a Date object by using the year, month (subtract 1 as months are 0-indexed), and day
  const dateObject = new Date(year, month - 1, day);

  return dateObject;
}

async function padNumberWithZeros(number, length) {
  // Convert number to string
  let numberStr = number.toString();

  // Calculate the number of zeros to add
  const zerosToAdd = Math.max(0, length - numberStr.length);

  // Pad the number with zeros
  const paddedNumber = "0".repeat(zerosToAdd) + numberStr;

  return paddedNumber;
}

async function generateSerialNo(tablename) {
  const serialNo = await knex(tablename)
    .select("id")
    .orderBy("id", "desc")
    .first();
  if (serialNo == undefined) {
    return 1;
  }
  return serialNo.id;
}

const createAsn3 = async (req, res) => {
  try {
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

    const { error, value } = validation.create(req.body.DATA);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    // console.log("values", value);
    let {
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems,
      status,
      gst,
      pan,
      irnNo,
      companyGST,
      companyPAN,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      departmentId,
      invoiceType,
      // totalAmount
    } = value;

    const checkPlant = await knex("plants").where({ id: plantId });
    if (checkPlant.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Plant not found.",
      });
    }

    if (type == "ZSER") {
      status = "requested";
      const asnNo2 = asnNo.replace(/^.{3}/, "SCR");
      asnNo = asnNo2;

      let li = [];
      lineItems.map((item, index) => {
        const serviceName = item.itemName;
        delete lineItems[index]["itemName"];
        li.push({ serviceName: serviceName, ...lineItems[index] });
      });
      lineItems = [];
      lineItems = li;
      //   //if you want to not show blank fields
      //   // lineItems.map((item) => {
      //   //   Obj.push(Object.keys(item));
      //   // });
      //   // Obj.forEach((item, index) => {
      //   //   item.map((value, ind) => {
      //   //     // if (lineItems[index][value] == "") {
      //   //     //   delete lineItems[index][value];
      //   //     // }
      //   //   });
      //   // });
    }

    const lineItemsValue = JSON.stringify(lineItems);

    const todaysDate = new Date().getDate() + "";
    const todaysMonth = new Date().getMonth() + 1 + "";
    const todaysYear = new Date().getFullYear() + "";

    const currentDate = new Date(
      stringToDate(todaysDate + "-" + todaysMonth + "-" + todaysYear)
    );

    const dispatchDateIs = new Date(stringToDate(dispatchDate));

    const dispatchDatePart = dispatchDateIs.getDate() + "";
    const dispatchMonthPart = dispatchDateIs.getMonth() + 1 + "";
    const dispatchYearPart = dispatchDateIs.getFullYear() + "";

    dispatchDate = new Date(
      stringToDate(
        dispatchDatePart + "-" + dispatchMonthPart + "-" + dispatchYearPart
      )
    );

    console.log(dispatchDate, "this is dispatch date");
    if (dispatchDateIs < currentDate) {
      return res.status(400).json({
        error: true,
        message: "Delivery date should not be less than current date",
      });
    }
    const checkDeptId = await knex("departments")
      .where("id", departmentId)
      .first();

    console.log(checkDeptId, "department")
    if (checkDeptId == undefined) {
      return res.status(404).json({
        error: true,
        message: "Department not found",
      });
    }

    let serialnumber = (await generateSerialNo("asns")) + 1;
    console.log("sno", serialnumber);
    let notype = "";
    if (type == "NB") {
      notype = "ASN";
    } else {
      notype = "SCR";
    }

    asnNo = notype + poNo + (await padNumberWithZeros(serialnumber, 5));
    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const emptyArray = [];

    const insertASN = await knex("asns").insert({
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems: lineItemsValue,
      status,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      irnNo,
      departmentId,
      invoiceType,
      companyGST,
      companyPAN,
      // totalAmount,
      sesId: JSON.stringify(emptyArray),
      createdAt: currentDateIST,
      updatedAt: currentDateIST,
    });
    if (!insertASN) {
      return res.status(500).json({
        error: true,
        message: "ASN could not submited",
      });
    }

    let asnQty = [];
    let poQty = [];
    let remaining = [];
    const fetchedQuantity = req.body.orderlineDataCopy;

    const getPoStock = await knex("poStock").where("poNo", poNo);
    if (getPoStock.length <= 0) {
      let zero = 0;
      lineItems.forEach((item, index) => {
        if (item.Quantity == 0) {
          zero += 1;
        }
        asnQty.push(item.Quantity);
        poQty.push(fetchedQuantity[index].Quantity);
        remaining.push(
          parseInt(fetchedQuantity[index].Quantity) - parseInt(item.Quantity)
        );
      });

      if (zero == lineItems.length) {
        return res.status(400).json({
          error: true,
          message: "Can't set all Quantities to 0",
        });
      }
      const data = {
        poNo,
        poQty: JSON.stringify(fetchedQuantity),
        asnQty: JSON.stringify(asnQty),
        remaining: JSON.stringify(remaining),
      };
      const insertpoStock = await knex("poStock").insert(data);
      if (insertpoStock.length <= 0) {
        return res.status(500).json({
          error: true,
          message: "Failed to insert into PO stock.",
        });
      }
    } else {
      getPoStock[0].remaining = JSON.parse(getPoStock[0].remaining);
      getPoStock[0].asnQty = JSON.parse(getPoStock[0].asnQty);
      getPoStock[0].poQty = JSON.parse(getPoStock[0].poQty);
      let counter = [];
      let Zero = 0;
      getPoStock[0].poQty.forEach((item, index) => {
        if (
          parseInt(lineItems[index].Quantity) >
            getPoStock[0].remaining[index] &&
          lineItems[index].itemName == item.itemName
        ) {
          counter.push(index);
        } else {
          if (lineItems[index].Quantity == 0) {
            Zero += 1;
          }
          const temp =
            parseInt(getPoStock[0].asnQty[index]) +
            parseInt(lineItems[index].Quantity);
          const remainingqtty = parseInt(item.Quantity) - temp;
          asnQty.push(temp);
          remaining.push(remainingqtty);
        }
      });
      if (Zero == lineItems.length) {
        return res.status(400).json({
          error: true,
          message: "Can'n set all Quantities to 0",
        });
      }

      if (counter.length > 0) {
        return res.status(500).json({
          error: true,
          message: "PO has been fulfiled can't create more asn",
        });
      }

      const updatepoStock = await knex("poStock")
        .update({
          asnQty: JSON.stringify(asnQty),
          remaining: JSON.stringify(remaining),
        })
        .where("poNo", poNo);
      if (updatepoStock.length <= 0) {
        return res.status(500).json({
          error: true,
          message: "Failed to update the stock.",
        });
      }
    }

    if (type != "ZSER") {
      const insertASNMaterial = await knex("asnMaterialReceived").insert({
        asn_id: insertASN,
        poNo,
        poDate,
        asnNo,
        plantId,
        supplierId,
        dispatchDate,
        type,
        carrier,
        lineItems: lineItemsValue,
        status: "materialShipped",
        gst,
        pan,
        irnNo,
        gstInvoiceNumber,
        shipToAddress,
        billToAddress,
        remarks,
        file,
        eWayBillNo,
        departmentId,
        remarks,
        invoiceType,
        // totalAmount,
        companyGST,
        companyPAN,
      });
      if (!insertASNMaterial) {
        return res.status(500).json({
          error: true,
          message: "Latest ASN could not stored",
        });
      }
    }
    let insertTimeLine;

    if (type == "ZSER") {
      const data = {
        asn_id: insertASN,
        requested: statusChangerId,
        requestedTime: dispatchDate,
        requestedStatus: status,
        requestedRemarks: remarks,
      };
      insertTimeLine = await knex("scrStatusTimeline").insert(data);

      //send email to company of supplier if supplier type is ZSER

      const recordIs = await knex("asns")
        .where("id", insertASN[0])
        .select("lineItems", "poNo", "plantId", "dispatchDate")
        .first();

      const plantName = await knex("plants")
        .where("id", recordIs.plantId)
        .select("name")
        .first();

      const part1 = `
  <table style="border:0.5px solid orange; border-radius:5px;">
      <tr>
          <td style="width:20%;"></td>
          <td style="padding-top:10%;"><b>Hello <u>SK Patel Group</u>,</b><br><br>ASN is created successfully for the 
              PO No.: <u>${
                recordIs.poNo
              }</u>. Will be served by date: <u>${moment(
        recordIs.dispatchDate
      ).format("DD-MM-YYYY")}</u>.<br><br>
              <table border=1px cellspacing=0px width=100%>
                  <caption>
                      <B>Line Items</B>
                  </caption>
                  <tr>
                      <th>SrNo.</th>
                      <th>Service</th>
                      <th>Unit</th> 
                      <th>Fees</th>
                  </tr>`;

      let key = 1;
      let lineItemsPart = "";

      for (const iterator of JSON.parse(recordIs.lineItems)) {
        lineItemsPart += `<tr align="center">
                      <td>${key++}.</td>
                      <td>${iterator.serviceName}</td>
                      <td>${iterator.unit}</td>
                      <td>${iterator.price}</td>
                    </tr>`;
      }

      const part2 = `</table><br>
              <br><br>Regards, <br>
              <B>${constants.admindetails.companyFullName}</B> <br><br><br>
              <center>${constants.admindetails.address1},<br>${constants.admindetails.address2}, ${constants.admindetails.state},${constants.admindetails.country}<br><br><br><img style="width:80px;" src="${constants.admindetails.companyLogo}" /><br>Powered By ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center>
          </td>
          <td style="width:20%;"></td>
      </tr>
  </table>`;

      let emailTemplateBody = part1 + lineItemsPart + part2;

      const emailSentStatus = ses.sendEmail(
        constants.sesCredentials.fromEmails.emailOtp,
        "supplierxuser@gmail.com",
        "SCR created successfully",
        emailTemplateBody
      );

      //send email to company of supplier over...
    } else {
      const data = {
        asn_id: insertASN,
        MaterialShipped: statusChangerId,
        MaterialShippedTime: dispatchDate,
        MaterialShippedStatus: status,
        MaterialShippedRemarks: remarks,
      };
      insertTimeLine = await knex("asnStatusTimeline").insert(data);

      //send email to company of supplier

      const recordIs = await knex("asns")
        .where("id", insertASN[0])
        .select("lineItems", "poNo", "plantId", "dispatchDate")
        .first();

      const plantName = await knex("plants")
        .where("id", recordIs.plantId)
        .select("name")
        .first();

      const part1 = `
  <table style="border:0.5px solid orange; border-radius:5px;">
      <tr>
          <td style="width:20%;"></td>
          <td style="padding-top:10%;"><b>Hello <u>SK Patel Group</u>,</b><br><br>ASN is created successfully for the 
              PO No.: <u>${recordIs.poNo}</u> for
              plant <u>${
                plantName.name
              }</u>. Will be dispatched on date: <u>${moment(
        recordIs.dispatchDate
      ).format("DD-MM-YYYY")}</u>.<br><br>
              <table border=1px cellspacing=0px width=100%>
                  <caption>
                      <B>Line Items</B>
                  </caption>
                  <tr>
                      <th>SrNo.</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                  </tr>`;

      let key = 1;
      let lineItemsPart = "";

      for (const iterator of JSON.parse(recordIs.lineItems)) {
        lineItemsPart += `<tr align="center">
                      <td>${key++}.</td>
                      <td>${iterator.itemName}</td>
                      <td>${iterator.Quantity}</td>
                      <td>${iterator.price}</td>
                    </tr>`;
      }

      const part2 = `</table><br>
              <B>Current Status:</B> <u>Material Shipped</u><br><br>Regards, <br>
              <B>${constants.admindetails.companyFullName}</B> <br><br><br>
              <center>${constants.admindetails.address1},<br>${constants.admindetails.address2}, ${constants.admindetails.state},${constants.admindetails.country}<br><img style="width:80px;" src="${constants.admindetails.companyLogo}" /><br> Powered By ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center>
          </td>
          <td style="width:20%;"></td>
      </tr>
  </table>`;

      let emailTemplateBody = part1 + lineItemsPart + part2;

      const emailSentStatus = ses.sendEmail(
        constants.sesCredentials.fromEmails.emailOtp,
        "supplierxuser@gmail.com",
        "ASN created successfully",
        emailTemplateBody
      );

      //send email to company of supplier over...
    }

    let getType;
    if (type == "ZSER") {
      getType = "SCR";
    } else {
      getType = "ASN";
    }
    const createNotification = await notification.createNotification(
      [statusChangerId],
      `${getType} Created !`,
      `${getType} created for ${poNo} of ${getType} no: ${asnNo}`,
      "0"
    );

    if (!insertTimeLine) {
      return res.status(201).json({
        error: false,
        message: "ASN submitted successfully",
        data: insertASN,
      });
    }
    return res.status(201).json({
      error: false,
      message: "ASN submitted successfully and timeline created.",
      data: insertASN,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

// const PaginateAsn2 = async (req, res) => {
//   try {
//     const tableName = "asns";
//     const searchFrom = ["poNo", "status", "asnNo", "type"];

//     const schema = Joi.object({
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(50),
//       sort: Joi.string().default("id"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
//       status: Joi.string()
//         .allow(
//           "all",
//           "materialShipped",
//           "materialGateInward",
//           "materialReceived",
//           "qualityApproved",
//           "invoiced",
//           "partiallyPaid",
//           "fullyPaid",
//           "unpaid",
//           "requested",
//           "accepted"
//         )
//         .default("all"),
//       type: Joi.valid("ASN", "SCR", "").default(""),
//       search: Joi.string().allow("", null).default(null),
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

//     let { offset, limit, order, sort, search, status } = value;
//     let results = knex(tableName);
//     if (status != undefined && status != "") {
//       total = results.where("status", status);
//     }

//     // if (status !== undefined && status !== "") {
//     //   if (status !== "all") { // Skip filtering if status is "all"
//     //     total = results.where("status", status);
//     //     results.where("status", status);
//     //   }
//     // }
//     results = results.where(function () {
//       if (search != undefined && search != "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
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
//     });
//     rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

//     for (const currentrow of rows) {
//       if (currentrow.type == "ZSER") {
//         let asnno = currentrow.asnNo;
//         currentrow.asnNo = "SCR" + asnno.substr(3);
//         //console.log("done:=", currentrow.asnNo, asnno);
//       }
//     }

//     let data_rows = [];
//     if (order === "desc") {
//       let sr = offset + 1;
//       await rows.forEach((row) => {
//         row.sr = sr;
//         delete row.password;
//         row.lineItems = JSON.parse(row.lineItems);
//         data_rows.push(row);
//         sr++;
//       });
//     } else {
//       let sr = total.total - limit * offset;
//       await rows.forEach((row) => {
//         row.sr = sr;
//         delete row.password;
//         row.lineItems = JSON.parse(row.lineItems);
//         data_rows.push(row);
//         sr--;
//       });
//     }
//     return res.status(200).json({
//       error: false,
//       message: "Retrieved successfully.",
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

//without date filter
// const PaginateAsn2 = async (req, res) => {
//    try {
//   const tableName = "asns";
//   const searchFrom = ["poNo", "status", "asnNo", "type"];

//   const schema = Joi.object({
//     offset: Joi.number().default(0),
//     limit: Joi.number().default(10000),
//     sort: Joi.string().default("id"),
//     order: Joi.string().valid("asc", "desc").default("desc"),
//     status: Joi.string()
//       .valid(
//         "all",
//         "materialShipped",
//         "materialGateInward",
//         "materialReceived",
//         "qualityApproved",
//         "invoiced",
//         "partiallyPaid",
//         "fullyPaid",
//         "unpaid",
//         "requested",
//         "accepted"
//       )
//       .default("all"),
//     type: Joi.string().valid("ASN", "SCR", "").default(""),
//     search: Joi.string().allow("", null).default(null),
//     sortable: Joi.string()
//       .valid("type", "asnNo", "poNo", "dispatchDate", "status")
//       .default("id"),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//       data: error,
//     });
//   }

//   let {
//     offset = 0,
//     limit = 100,
//     order = "asc",
//     sort = "id",
//     search,
//     status = "all",
//     type,
//     sortable = "id",
//   } = value;

//   let results = knex(tableName);

//   if (status != "all") {
//     results.where("status", status);
//   }

//   if (type) {
//     if (type === "ASN") {
//       results.where("type", "NB");
//     } else if (type === "SCR") {
//       results.where("type", "ZSER");
//     }
//   }

//   if (search) {
//     results = results.where(function () {
//       if (search != undefined && search != "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//     });
//   }

//   const totalCount = await results.clone().count("id as total").first();
//   const total = totalCount.total;

//   let rows = knex(tableName);

//   if (status != "all") {
//     rows.where("status", status);
//   }

//   if (type != undefined) {
//     if (type === "ASN") {
//       rows.where("type", "NB");
//     } else if (type === "SCR") {
//       rows.where("type", "ZSER");
//     }
//   }

//   if (search != undefined) {
//     rows = rows.where(function () {
//       if (search != undefined && search != "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//     });
//   }

//   rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

//   let data_rows = [];
//   if (order === "desc") {
//     let sr = offset + 1;
//     await rows.forEach((row) => {
//       row.sr = sr;
//       row.lineItems = JSON.parse(row.lineItems);
//       data_rows.push(row);
//       sr++;
//     });
//   } else {
//     let sr = total - limit * offset;
//     await rows.forEach((row) => {
//       row.sr = sr;
//       row.lineItems = JSON.parse(row.lineItems);
//       data_rows.push(row);
//       sr--;
//     });
//   }

//   return res.status(200).json({
//     error: false,
//     message: "Retrieved successfully.",
//     data: {
//       rows: data_rows,
//       total: total,
//     },
//   });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };

//with date filter startDate,endDate
const PaginateAsn2 = async (req, res) => {
  try {
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
    const email = payload.email;
    const { error, value } = validation.PaginateAsn2(req.body);

    const {
      offset,
      limit,
      sort,
      order,
      status,
      type,
      search,
      filter,
      dropdown,
    } = value;
    const { startDate, endDate, dateField } = filter;

    let getSuppId = [];
    if (dropdown == "supplier") {
      getSuppId = await knex("supplier_details")
        .select("sap_code")
        .where("emailID", email);
      if (getSuppId.length <= 0) {
        return res.status(404).json({
          error: true,
          message: "Supplier does not exist.",
        });
      }
    }
    const validDateFields = ["createdAt", "dispatchDate"];

    if (dateField && !validDateFields.includes(dateField)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid date field. Allowed values are 'createdAt' and 'dispatchDate'.",
        data: null,
      });
    }

    let query = knex("asns");

    if (dropdown == "supplier") {
      await query.where("supplierId", getSuppId[0].sap_code);
    } else {
      await query.whereNot("status", "cancelled");
    }

    if (status !== "all") {
      query.where("status", status);
    }

    // Map input type values to corresponding database values
    const typeMapping = {
      ASN: "NB",
      SCR: "ZSER",
    };
    const mappedType = typeMapping[type];

    if (mappedType) {
      query.where("type", mappedType);
    } else if (type !== "") {
      // Handle invalid type value
      return res.status(400).json({
        error: true,
        message: "Invalid type value. Allowed values are 'ASN' and 'SCR'.",
        data: null,
      });
    }

    if (search && search !== "") {
      // Define the fields to search in
      const searchFrom = ["poNo", "status", "asnNo", "type"];

      query.where((builder) => {
        searchFrom.forEach((element) => {
          builder.orWhere(element, "LIKE", `%${search}%`);
        });
      });
    }

    // if (startDate && endDate && dateField) {
    //   const startDateISO = new Date(startDate).toISOString();
    //   const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();

    //   if (dateField === "createdAt") {
    //     query.whereBetween("createdAt", [startDateISO, endDateISO]);
    //   } else if (dateField === "dispatchDate") {
    //     query.whereBetween("dispatchDate", [startDateISO, endDateISO]);
    //   }
    // }

    if (startDate && endDate && dateField) {
      const startDateISO = new Date(startDate).toISOString();
      // Ensure endDate is in a format that can be parsed
      let endDateISO = new Date(endDate).toISOString();

      // Add "T23:59:59.999Z" to set the end time to the end of the day
      endDateISO = endDateISO.slice(0, 10) + "T23:59:59.999Z";
      console.log(endDateISO);
      if (dateField === "createdAt") {
        query.whereBetween("createdAt", [startDateISO, endDateISO]);
      } else if (dateField === "dispatchDate") {
        query.whereBetween("dispatchDate", [startDateISO, endDateISO]);
      }
    }

    const totalCountResult = await query.clone().count("id as total").first();
    const total = totalCountResult.total;

    let rows = await query.orderBy(sort, order).limit(limit).offset(offset);

    let sr = offset + 1;

    rows = rows.map((row) => {
      return {
        ...row,
        lineItems: JSON.parse(row.lineItems),
        sr: sr++,
      };
    });

    // if (order === "desc") {
    //   rows.sort((a, b) => a.sr - b.sr);
    //  } else {
    //   rows.sort((a, b) => b.sr - a.sr);
    //  }

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: {
        rows: rows,
        total: total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
      data: error.message || "Could not load record.",
    });
  }
};

const PaginateAsn = async (req, res) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Token is required.",
    });
  }

  const { jwtConfig } = constant;
  const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
  const {
    permissions: [statusChanger],
    id: statusChangerId,
    email,
  } = payload;

  const { value, error } = validation.PaginateAsn(req.body);

  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      data: null,
    });
  }

  let {
    offset,
    limit,
    sort,
    order,
    status,
    type,
    search,
    filter: { startDate, endDate, dateField },
    dropdown = "all",
  } = value;
  let supplierDetails;
  if (dropdown === "supplier") {
    supplierDetails = await knex("supplier_details")
      .select("sap_code")
      .where("emailID", email)
      .first();

    if (!supplierDetails) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist.",
      });
    }
  }

  const validDateFields = ["createdAt", "dispatchDate"];

  if (dateField && !validDateFields.includes(dateField)) {
    return res.status(400).json({
      error: true,
      message:
        "Invalid date field. Allowed values are 'createdAt' and 'dispatchDate'.",
      data: null,
    });
  }

  let query = knex("asns");

  if (dropdown === "supplier") {
    query.where("supplierId", supplierDetails.sap_code);
  } else {
    query.whereNot("status", "cancelled");
  }

  if (status !== "all") {
    query.where("status", status);
  }

  const typeMapping = {
    ASN: "NB",
    SCR: "ZSER",
  };
  const mappedType = typeMapping[type];

  if (mappedType) {
    query.where("type", mappedType);
  } else if (type !== "") {
    return res.status(400).json({
      error: true,
      message: "Invalid type value. Allowed values are 'ASN' and 'SCR'.",
      data: null,
    });
  }

  if (search && search !== "") {
    const searchFrom = ["poNo", "status", "asnNo", "type"];

    query.where((builder) => {
      searchFrom.forEach((element) => {
        builder.orWhere(element, "LIKE", `%${search}%`);
      });
    });
  }

  if (startDate && endDate && dateField) {
    const startDateISO = new Date(startDate).toISOString();
    let endDateISO = new Date(endDate).toISOString();
    endDateISO = endDateISO.slice(0, 10) + "T23:59:59.999Z";

    query.whereBetween(dateField, [startDateISO, endDateISO]);
  }

  const totalCountResult = await query.clone().count("id as total").first();
  const total = totalCountResult.total;
  console.log("this is sort:", sort);
  sort = sort != "" && sort != undefined ? sort : "id";
  let rows = await query
    .select(
      "*",
      knex.raw("CONVERT_TZ(createdAt, 'UTC', 'Asia/Kolkata') AS createdAt"),
      knex.raw("CONVERT_TZ(updatedAt, 'UTC', 'Asia/Kolkata') AS UpdatedAt")
    )
    .orderBy(sort, order) // Use orderByColumn instead of sort
    .limit(limit)
    .offset(offset);
  let sr = offset + 1;

  rows = rows.map((row) => ({
    ...row,
    lineItems: row.lineItems ? JSON.parse(row.lineItems) : [],
    sr: sr++,
  }));

  return res.status(200).json({
    error: false,
    message: "Retrieved successfully.",
    data: {
      rows,
      total,
    },
  });
};

const viewAsn2 = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    //get vehicle details
    const getVehicleDetails = await knex("vehicals")
      .where({ asn_id: id })
      .first();

    // if(!getVehicleDetails){
    //   return res.json({
    //     error:true,
    //     message:"Vehicle details not found for this asn"
    //   }).end()
    // }

    if (getVehicleDetails) {
      //get plant name
      let getPlantName = await knex("plants")
        .where({ id: getVehicleDetails.comeFrom })
        .select("name")
        .first();
      if (!getPlantName) {
        return res
          .status(404)
          .json({
            error: true,
            message: "Plant with this id does not exist",
          })
          .end();
      }
      const plantName = getPlantName.name;
      var vehicleDetailsResponse = getVehicleDetails
        ? { vehicleDetails: { ...getVehicleDetails, comeFrom: plantName } }
        : {};
    }

    // const vehicleDetailsResponse = getVehicleDetails
    //   ? { vehicleDetails: { ...getVehicleDetails} }
    //   : {};
    let asn = [];
    asn = await knex("asns").where({ id }).first();
    const lineItems = JSON.parse(asn.lineItems);
    const temp = asn;
    if (
      (asn.status == "materialReceived" ||
        asn.status == "partiallyReceived" ||
        asn.status == "qualityApproved" ||
        asn.status == "invoiced") &&
      asn.type != "ZSER"
    ) {
      asn = [];
      asn = await knex("asnMaterialReceived").where("asn_id", id).first();
      if (!asn) {
        asn = temp;
      }
    }
    if (!asn) {
      return res.status(404).json({
        error: true,
        message: "ASN not found",
      });
    }

    asn.lineItems = JSON.parse(asn.lineItems);
    lineItems.forEach((item, index) => {
      asn.lineItems[index].previousQuantity = item.Quantity;
    });
    const getTimeLine = async (id, type) => {
      let getTimeLine = [];
      if (type == "ZSER") {
        const checkScr = await knex("scrStatusTimeline").where("asn_id", id);

        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex("scrStatusTimeline")
            .select({
              Intial_User: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              Intial_Time: "scrStatusTimeline.requestedTime",
              Intial_Status: "scrStatusTimeline.requestedStatus",
              Intial_Remarks: "scrStatusTimeline.requestedRemarks",
              Standard_Department_User: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              AcceptedTime: "scrStatusTimeline.acceptedTime",
              Status1: "scrStatusTimeline.acceptedStatus",
              AcceptedRemarks: "scrStatusTimeline.acceptedRemarks",
              Accounts_Executive: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              InvoicedTime: "scrStatusTimeline.invoicedTime",
              Status2: "scrStatusTimeline.invoicedStatus",
              InvoicedRemarks: "scrStatusTimeline.invoicedRemarks",
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              "scrStatusTimeline.requested"
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              "scrStatusTimeline.accepted"
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              "scrStatusTimeline.invoiced"
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].Intial_User,
              Time: getTimeLine[0].Intial_Time,
              Status: getTimeLine[0].Intial_Status,
              Remarks: getTimeLine[0].Intial_Remarks,
            },
            {
              Name: getTimeLine[0].Standard_Department_User,
              Time: getTimeLine[0].AcceptedTime,
              Status: getTimeLine[0].Status1,
              Remarks: getTimeLine[0].AcceptedRemarks,
            },
            {
              Name: getTimeLine[0].Accounts_Executive,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status2,
              Remarks: getTimeLine[0].InvoicedRemarks,
            },
          ];

          getTimeLine = [];
          getTimeLine.push(data);
          if (asn.status == "cancelled") {
            getTimeLine = [];
            getTimeLine = await knex("scrStatusTimeline")
              .select({
                Name: knex.raw("CONCAT(users.firstname, ' ', users.lastname)"),
                Time: "scrStatusTimeline.CancelTime",
                Status: "scrStatusTimeline.CancelStatus",
                Remarks: "scrStatusTimeline.CancelRemarks",
              })
              .leftJoin(
                "users as users",
                "users.id",
                "=",
                "scrStatusTimeline.requested"
              )
              .where("asn_id", id);

            const data = [
              {
                Name: getTimeLine[0].Name,
                Time: getTimeLine[0].Time,
                Status: getTimeLine[0].Status,
                Remarks: getTimeLine[0].Remarks,
              },
            ];
            getTimeLine = [];
            getTimeLine.push(data);
          }
        }
      } else {
        const tableName = "asnStatusTimeline";
        const checkScr = await knex(tableName).where("asn_id", id);
        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex(tableName)
            .select({
              MaterialShipped: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              MaterialShippedTime: `${tableName}.MaterialShippedTime`,
              Status: `${tableName}.MaterialShippedStatus`,
              MaterialShippedRemarks: `${tableName}.MaterialShippedRemarks`,
              MaterialGateInward: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              MaterialGateInwardTime: `${tableName}.MGITime`,
              Status1: `${tableName}.MaterialGateInwardStatus`,
              MaterialGateInwardRemarks: `${tableName}.MaterialGateInwardRemarks`,

              MaterialReceived: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              MaterialReceivedTime: `${tableName}.MaterialReceivedTime`,
              Status2: `${tableName}.MaterialReceivedStatus`,
              MaterialReceivedRemarks: `${tableName}.MaterialReceivedRemarks`,

              QualityApproved: knex.raw(
                "CONCAT(users3.firstname, ' ', users3.lastname)"
              ),
              QualityApprovedTime: `${tableName}.QualityApprovedTime`,
              Status3: `${tableName}.QualityApprovedStatus`,
              QualityApprovedRemarks: `${tableName}.QualityApprovedRemarks`,
              Invoiced: knex.raw(
                "CONCAT(users4.firstname, ' ', users4.lastname)"
              ),
              InvoicedTime: `${tableName}.InvoicedTime`,
              Status4: `${tableName}.InvoicedStatus`,
              InvoicedRemarks: `${tableName}.InvoicedRemarks`,
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              `${tableName}.MaterialShipped`
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              `${tableName}.MaterialGateInward`
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              `${tableName}.MaterialReceived`
            )
            .leftJoin(
              "users as users3",
              "users3.id",
              "=",
              `${tableName}.QualityApproved`
            )
            .leftJoin(
              "users as users4",
              "users4.id",
              "=",
              `${tableName}.Invoiced`
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].MaterialShipped,
              Time: getTimeLine[0].MaterialShippedTime,
              Status: getTimeLine[0].Status,
              Remarks: getTimeLine[0].MaterialShippedRemarks,
            },
            {
              Name: getTimeLine[0].MaterialGateInward,
              Time: getTimeLine[0].MaterialGateInwardTime,
              Status: getTimeLine[0].Status1,
              Remarks: getTimeLine[0].MaterialGateInwardRemarks,
            },
            {
              Name: getTimeLine[0].MaterialReceived,
              Time: getTimeLine[0].MaterialReceivedTime,
              Status: getTimeLine[0].Status2,
              Remarks: getTimeLine[0].MaterialReceivedRemarks,
            },
            {
              Name: getTimeLine[0].QualityApproved,
              Time: getTimeLine[0].QualityApprovedTime,
              Status: getTimeLine[0].Status3,
              Remarks: getTimeLine[0].QualityApprovedRemarks,
            },
            {
              Name: getTimeLine[0].Invoiced,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status4,
              Remarks: getTimeLine[0].InvoicedRemarks,
            },
          ];
          getTimeLine = [];
          getTimeLine.push(data);

          if (asn.status == "cancelled") {
            getTimeLine = [];
            getTimeLine = await knex("asnStatusTimeline")
              .select({
                Name: knex.raw("CONCAT(users.firstname, ' ', users.lastname)"),
                Time: "asnStatusTimeline.CancelTime",
                Status: "asnStatusTimeline.CancelStatus",
                Remarks: "asnStatusTimeline.CancelRemarks",
              })
              .leftJoin(
                "users as users",
                "users.id",
                "=",
                "asnStatusTimeline.Cancel"
              )
              .where("asn_id", id);

            const data = [
              {
                Name: getTimeLine[0].Name,
                Time: getTimeLine[0].Time,
                Status: getTimeLine[0].Status,
                Remarks: getTimeLine[0].Remarks,
              },
            ];
            getTimeLine = [];
            getTimeLine.push(data);
          }
        }
      }
      return getTimeLine[0];
    };

    const timeline = await getTimeLine(id, asn.type);

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: asn,
      timeline: timeline,
      ...vehicleDetailsResponse,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteAsn2 = async (req, res) => {
  // try {
  const tableName = "asns";
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

  const { error, value } = validation.del(req.params);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }
  const { id } = value;
  const getType2 = await knex("asns").where({ id });
  const getType = await knex("asnMaterialReceived").where({ id });

  if (getType2.length <= 0) {
    return res.status(404).json({
      error: true,
      message: "ASN not found",
    });
  }

  if (getType2[0].status != "cancelled") {
    return res.json({
      error: true,
      message: "Only cancelled asn can be deleted",
    });
  }

  const asn_id = id;
  let dltTimeline;
  if (getType2[0].type == "ZSER") {
    dltTimeline = await knex("scrStatusTimeline").where({ asn_id }).del();
  } else {
    dltTimeline = await knex("asnStatusTimeline").where({ asn_id }).del();
    const dltinasnMaterial = await knex("asnMaterialReceived")
      .where({ asn_id })
      .del();
  }
  try {
    await logs.logOldValues(tableName, id, value, req);
  } catch {
    console.log(error);
  }

  const asn = await knex("asns").where({ id }).del();
  if (!asn) {
    return res.status(404).json({
      error: false,
      message: "ASN not found.",
    });
  }

  let getASNType;
  if (getType2[0].type == "ZSER") {
    getASNType = "SCR";
  } else {
    getASNType = "ASN";
  }

  const createNotification = await notification.createNotification(
    [statusChangerId],
    `${getASNType} Deleted !`,
    `${getASNType} Deleted of ${getType2[0].poNo} and ${getASNType} no: ${getType2[0].asnNo}`,
    "0"
  );

  if (asn && !dltTimeline) {
    return res.status(200).json({
      error: false,
      message: "ASN deleted successfully.",
    });
  }

  return res.status(200).json({
    error: false,
    message: "ASN & Status History deleted successfully",
  });
  // } catch (error) {
  //   return res.json({
  //     error: true,
  //     message: "Something went wrong",
  //     data: JSON.stringify(error),
  //   });
  // }
};

const updateAsn2 = async (req, res) => {
  try {
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      id,
      poNo,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems,
      status,
    } = value;

    let currentPOqty = 0;
    const totalPOqty = 1100; //to do : total purchase order qty will come here

    for (const iterator of lineItems) {
      currentPOqty += iterator.orderQuantity;
    }

    if (currentPOqty != totalPOqty) {
      return res.json({
        error: true,
        message:
          "Total PO quantity should be equal to the sum of order quantities",
      });
    }

    const lineItemsValue = JSON.stringify(lineItems);

    const todaysDate = new Date().getDate() + "";
    const todaysMonth = new Date().getMonth() + 1 + "";
    const todaysYear = new Date().getFullYear() + "";

    const currentDate = new Date(
      stringToDate(todaysDate + "-" + todaysMonth + "-" + todaysYear)
    );

    const dispatchDateIs = new Date(stringToDate(dispatchDate));

    console.log(currentDate, dispatchDateIs);

    if (dispatchDateIs < currentDate) {
      return res.status(400).json({
        error: true,
        message: "Delivery date should not be less than current date",
      });
    }

    const updateASN = await knex("asns").where({ id }).update({
      poNo,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems: lineItemsValue,
      status,
    });

    if (!updateASN) {
      return res.status(500).json({
        error: true,
        message: "ASN could not updated",
      });
    }
    return res.status(200).json({
      error: false,
      message: "ASN updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const QRCodeAsn = async (req, res) => {
  try {
    const { error, value } = validation.QRCodeAsn(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    const asn = await knex("asns")
      .where({ id })
      .select("id", "type", "status", "poNo", "supplierId", "plantId", "asnNo")
      .first();
    if (!asn) {
      return res.status(404).json({
        error: true,
        message: "ASN not found",
      });
    }

    let stringdata = JSON.stringify(asn);

    const secret = constant.jwtConfig.secret;

    const encryptedData = CryptoJS.AES.encrypt(stringdata, secret).toString();

    const credentials = new AWS.Credentials({
      accessKeyId: constant.s3Creds.accessKey,
      secretAccessKey: constant.s3Creds.secret,
    });
    AWS.config.credentials = credentials;

    const s3 = new AWS.S3({
      credentials: credentials,
    });

    // Converting the data into base64
    QRCode.toDataURL(
      encryptedData,
      { errorCorrectionLevel: "H", scale: 2 },
      function (err, code) {
        if (err) {
          return res.send({
            error: true,
            message: err.message,
          });
        }

        // Printing the code
        // console.log(code.split(',')[1])
        const imageBuffer = Buffer.from(code.split(",")[1], "base64");
        const QrCodeName = `QRCode${asn.asnNo}${id}.png`;
        const uploadParams = {
          Bucket: constant.s3Creds.bucket,
          Key: "asnQrcodes/" + QrCodeName,
          Body: Buffer.from(imageBuffer),
          ContentType: "image/png",
        };

        s3.upload(uploadParams, async (err, data) => {
          if (err) {
            return res.send({
              error: true,
              message: err.message,
            });
          }

          const QrCodeinDb = await knex("asns")
            .update("QrCode", QrCodeName)
            .where({ id });
          if (QrCodeinDb.length <= 0) {
            return res.send({
              error: false,
              message: "Uploaded to s3 but Failed to Insert name in Db.",
              QrCodeBase64: code.split(",")[1],
            });
          }
          return res.send({
            error: false,
            message: "Uploaded to s3 and Inserted name in Db.",
            QrCodeBase64: code.split(",")[1],
          });
        });
      }
    );
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

//this is working with editable
const checkQRCode = async (req, res) => {
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
  const { error, value } = validation.checkQRCode(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { text, asn_Id } = value;
  let obj;
  let getLatestAsn = [];
  let id = asn_Id;
  let type;
  let counter = 0;
  const search = ["poNo", "type", "id", "plantId", "supplierId", "status"];
  let oldASN = [];

  if (text) {
    try {
      const secret = constant.jwtConfig.secret;

      const decryptedData = CryptoJS.AES.decrypt(text, secret).toString(
        CryptoJS.enc.Utf8
      );
      eval("obj = " + decryptedData);
    } catch (error) {
      return res.json({
        error: true,
        message: "Wrong QRCode.",
      });
    }

    const keys = Object.keys(obj);

    search.forEach((item) => {
      keys.forEach((key) => {
        if (item == key) {
          counter += 1;
        }
      });
    });

    //const { id, type } = obj;
    getLatestAsn = await knex("asns").where("id", obj.id);
    oldASN = await knex("asns").where("id", obj.id);
    id = obj.id;
    type = obj.type;
  } else {
    getLatestAsn = await knex("asns").where("id", id);
    oldASN = await knex("asns").where("id", id);
    const getLatestAsn2 = await knex("asnMaterialReceived").where("asn_id", id);
    if (getLatestAsn2.length != 0) {
      getLatestAsn = [];
      getLatestAsn = getLatestAsn2;
    }
    type = getLatestAsn[0].type;
    // id = getLatestAsn[0].id;
    counter = search.length + 1;
  }

  if (getLatestAsn.length <= 0) {
    return res.status(404).json({
      error: true,
      message: "ASN not found",
    });
  }

  if (statusChanger === "Security Executive") {
    getLatestAsn[0].editable = "1";
  } else if (type != "ZSER") {
    const temp = getLatestAsn;
    getLatestAsn = [];
    getLatestAsn = await knex("asnMaterialReceived").where("asn_id", id);
    if (getLatestAsn.length <= 0) {
      getLatestAsn = temp;
    }
    if (statusChanger === "Store Keeper") {
      getLatestAsn[0].editable = "2";
    } else {
      getLatestAsn[0].editable = "3";
    }
  }

  getLatestAsn[0].lineItems = JSON.parse(getLatestAsn[0].lineItems);
  oldASN[0].lineItems = JSON.parse(oldASN[0].lineItems);
  oldASN[0].lineItems.forEach((item, index) => {
    getLatestAsn[0].lineItems[index].previousQuantity = item.Quantity;
  });

  const user = "users";
  let getTimeLine = [];
  if (type == "ZSER") {
    const checkScr = await knex("scrStatusTimeline").where("asn_id", id);

    if (checkScr.length <= 0) {
      return (getTimeLine = null);
    } else {
      getTimeLine = await knex("scrStatusTimeline")
        .select({
          Intial_User: knex.raw("CONCAT(users.firstname, ' ', users.lastname)"),
          Intial_Time: "scrStatusTimeline.requestedTime",
          Intial_Status: "scrStatusTimeline.requestedStatus",
          Intial_Remarks: "scrStatusTimeline.requestedRemarks",
          Standard_Department_User: knex.raw(
            "CONCAT(users1.firstname, ' ', users1.lastname)"
          ),
          AcceptedTime: "scrStatusTimeline.acceptedTime",
          Status1: "scrStatusTimeline.acceptedStatus",
          AcceptedRemarks: "scrStatusTimeline.acceptedRemarks",
          Accounts_Executive: knex.raw(
            "CONCAT(users2.firstname, ' ', users2.lastname)"
          ),
          InvoicedTime: "scrStatusTimeline.invoicedTime",
          Status2: "scrStatusTimeline.invoicedStatus",
          InvoicedRemarks: "scrStatusTimeline.invoicedRemarks",
        })
        .leftJoin(
          "users as users",
          "users.id",
          "=",
          "scrStatusTimeline.requested"
        )
        .leftJoin(
          "users as users1",
          "users1.id",
          "=",
          "scrStatusTimeline.accepted"
        )
        .leftJoin(
          "users as users2",
          "users2.id",
          "=",
          "scrStatusTimeline.invoiced"
        )
        .where("asn_id", id);

      const data = [
        {
          Name: getTimeLine[0].Intial_User,
          Time: getTimeLine[0].Intial_Time,
          Status: getTimeLine[0].Intial_Status,
          Remarks: getTimeLine[0].Intial_Remarks,
        },
        {
          Name: getTimeLine[0].Standard_Department_User,
          Time: getTimeLine[0].AcceptedTime,
          Status: getTimeLine[0].Status1,
          Remarks: getTimeLine[0].AcceptedRemarks,
        },
        {
          Name: getTimeLine[0].Accounts_Executive,
          Time: getTimeLine[0].InvoicedTime,
          Status: getTimeLine[0].Status2,
          Remarks: getTimeLine[0].InvoicedRemarks,
        },
      ];

      getTimeLine = [];
      getTimeLine.push(data);

      if (oldASN[0].status == "cancelled") {
        getTimeLine = [];
        getTimeLine = await knex("scrStatusTimeline")
          .select({
            Name: knex.raw("CONCAT(users.firstname, ' ', users.lastname)"),
            Time: "scrStatusTimeline.CancelTime",
            Status: "scrStatusTimeline.CancelStatus",
            Remarks: "scrStatusTimeline.CancelRemarks",
          })
          .leftJoin(
            "users as users",
            "users.id",
            "=",
            "scrStatusTimeline.requested"
          )
          .where("asn_id", id);

        const data = [
          {
            Name: getTimeLine[0].Name,
            Time: getTimeLine[0].Time,
            Status: getTimeLine[0].Status,
            Remarks: getTimeLine[0].Remarks,
          },
        ];
        getTimeLine = [];
        getTimeLine.push(data);
      }
    }
  } else {
    const tableName = "asnStatusTimeline";
    const checkScr = await knex(tableName).where("asn_id", id);
    if (checkScr.length <= 0) {
      return (getTimeLine = null);
    } else {
      getTimeLine = await knex(tableName)
        .select({
          MaterialShipped: knex.raw(
            "CONCAT(users.firstname, ' ', users.lastname)"
          ),
          MaterialShippedTime: `${tableName}.MaterialShippedTime`,
          Status: `${tableName}.MaterialShippedStatus`,
          MaterialShippedRemarks: `${tableName}.MaterialShippedRemarks`,
          MaterialGateInward: knex.raw(
            "CONCAT(users1.firstname, ' ', users1.lastname)"
          ),
          MaterialGateInwardTime: `${tableName}.MGITime`,
          Status1: `${tableName}.MaterialGateInwardStatus`,
          MaterialGateInwardRemarks: `${tableName}.MaterialGateInwardRemarks`,

          MaterialReceived: knex.raw(
            "CONCAT(users2.firstname, ' ', users2.lastname)"
          ),
          MaterialReceivedTime: `${tableName}.MaterialReceivedTime`,
          Status2: `${tableName}.MaterialReceivedStatus`,
          MaterialReceivedRemarks: `${tableName}.MaterialReceivedRemarks`,

          QualityApproved: knex.raw(
            "CONCAT(users3.firstname, ' ', users3.lastname)"
          ),
          QualityApprovedTime: `${tableName}.QualityApprovedTime`,
          Status3: `${tableName}.QualityApprovedStatus`,
          QualityApprovedRemarks: `${tableName}.QualityApprovedRemarks`,
          Invoiced: knex.raw("CONCAT(users4.firstname, ' ', users4.lastname)"),
          InvoicedTime: `${tableName}.InvoicedTime`,
          Status4: `${tableName}.InvoicedStatus`,
          InvoicedRemarks: `${tableName}.InvoicedRemarks`,
        })
        .leftJoin(
          "users as users",
          "users.id",
          "=",
          `${tableName}.MaterialShipped`
        )
        .leftJoin(
          "users as users1",
          "users1.id",
          "=",
          `${tableName}.MaterialGateInward`
        )
        .leftJoin(
          "users as users2",
          "users2.id",
          "=",
          `${tableName}.MaterialReceived`
        )
        .leftJoin(
          "users as users3",
          "users3.id",
          "=",
          `${tableName}.QualityApproved`
        )
        .leftJoin("users as users4", "users4.id", "=", `${tableName}.Invoiced`)
        .where("asn_id", id);
      if (getTimeLine.length > 0) {
        const data = [
          {
            Name: getTimeLine[0].MaterialShipped,
            Time: getTimeLine[0].MaterialShippedTime,
            Status: getTimeLine[0].Status,
            Remarks: getTimeLine[0].MaterialShippedRemarks,
          },
          {
            Name: getTimeLine[0].MaterialGateInward,
            Time: getTimeLine[0].MaterialGateInwardTime,
            Status: getTimeLine[0].Status1,
            Remarks: getTimeLine[0].MaterialGateInwardRemarks,
          },
          {
            Name: getTimeLine[0].MaterialReceived,
            Time: getTimeLine[0].MaterialReceivedTime,
            Status: getTimeLine[0].Status2,
            Remarks: getTimeLine[0].MaterialReceivedRemarks,
          },
          {
            Name: getTimeLine[0].QualityApproved,
            Time: getTimeLine[0].QualityApprovedTime,
            Status: getTimeLine[0].Status3,
            Remarks: getTimeLine[0].QualityApprovedRemarks,
          },
          {
            Name: getTimeLine[0].Invoiced,
            Time: getTimeLine[0].InvoicedTime,
            Status: getTimeLine[0].Status4,
            Remarks: getTimeLine[0].InvoicedRemarks,
          },
        ];
        getTimeLine = [];
        getTimeLine.push(data);
      }

      if (oldASN[0].status == "cancelled") {
        getTimeLine = [];
        getTimeLine = await knex("asnStatusTimeline")
          .select({
            Name: knex.raw("CONCAT(users.firstname, ' ', users.lastname)"),
            Time: "asnStatusTimeline.CancelTime",
            Status: "asnStatusTimeline.CancelStatus",
            Remarks: "asnStatusTimeline.CancelRemarks",
          })
          .leftJoin(
            "users as users",
            "users.id",
            "=",
            "asnStatusTimeline.Cancel"
          )
          .where("asn_id", id);

        const data = [
          {
            Name: getTimeLine[0].Name,
            Time: getTimeLine[0].Time,
            Status: getTimeLine[0].Status,
            Remarks: getTimeLine[0].Remarks,
          },
        ];
        getTimeLine = [];
        getTimeLine.push(data);
      }
    }
  }

  if (getTimeLine.length <= 0) {
    console.log("here");
    if (counter >= search.length - 1) {
      return res.json({
        error: false,
        data: getLatestAsn[0],
      });
    } else {
      return res.json({
        error: true,
        message: "Wrong QRCode.",
      });
    }
  }

  if (counter >= search.length - 1) {
    return res.json({
      error: false,
      timeline: getTimeLine[0],
      data: getLatestAsn[0],
    });
  } else {
    return res.json({
      error: true,
      message: "Wrong QRCode.",
    });
  }
  // } catch (error) {
  //   return res.json({
  //     error: true,
  //     message: "Wrong QRCode.",
  //     data: error.message,
  //   });
  // }
};

const asnStatusChange = async (req, res) => {
  try {
    const historyTable = "asn_status_history";
    const asnTable = "asns";

    let asnStatus = "invoiced";

    const { error, value } = validation.asnStatusChange(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const checkStatus = await knex(asnTable).where({ id }).first();
    if (checkStatus == undefined) {
      return res.status(404).json({
        error: true,
        message: "ASN not found",
      });
    }

    if (checkStatus.status == "materialShipped") {
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "materialGateInward" });

      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "materialGateInward",
      });

      asnStatus = "materialGateInward";
    }

    if (checkStatus.status == "materialGateInward") {
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "received" });

      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "received",
      });

      asnStatus = "received";
    }

    if (checkStatus.status == "received") {
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "qualityApproved" });

      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "qualityApproved",
      });

      asnStatus = "qualityApproved";
    }

    if (checkStatus.status == "qualityApproved") {
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "invoiced" });

      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "invoiced",
      });

      asnStatus = "invoiced";
    }

    return res
      .status(200)
      .json({
        error: false,
        message: "ASN status updated successfully to " + asnStatus,
      })
      .end();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
//   "partiallyPaid",
//   "fullyPaid",
//   "unpaid"

const asnPaymentStatusUpdate = async (req, res) => {
  try {
    const asnTable = "asns";
    const historyTable = "asn_status_history";
    const { error, value } = validation.paymentStatusUpdate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, status } = value;

    const checkStatus = await knex(asnTable).where({ id }).first();
    if (checkStatus == undefined) {
      return res.status(404).json({
        error: true,
        message: "ASN not found",
      });
    }

    const updateStatus = await knex(asnTable)
      .where({ id })
      .update({ status: status });

    const insertHistory = await knex(historyTable).insert({
      asnId: id,
      status: status,
    });

    return res.status(200).json({
      error: false,
      message: "ASN payment status updated successfully to " + status,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const viewAsnStatusHistory = async (req, res) => {
  try {
    const { error, value } = validation.viewStatusHistory(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getAsnStatusHistory = await knex("asn_status_history").where({
      asnId: id,
    });

    if (getAsnStatusHistory.length == 0) {
      return res.status(404).json({
        error: true,
        message: "ASN status history not found",
      });
    }

    return res
      .status(200)
      .json({
        error: false,
        message: "ASN status history found successfully",
        data: getAsnStatusHistory,
      })
      .end();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const viewAsnCurrentStatus = async (req, res) => {
  try {
    const { error, value } = validation.viewCurrentStatus(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getAsnCurrentStatus = await knex("asn_status_history")
      .where({ asnId: id })
      .orderBy("id", "desc")
      .limit(1);

    if (getAsnCurrentStatus == undefined || getAsnCurrentStatus == "") {
      return res
        .status(404)
        .json({
          error: true,
          message: "ASN not found",
        })
        .end();
    }

    return res
      .status(200)
      .json({
        error: false,
        message: "ASN current status found successfully",
        data: getAsnCurrentStatus,
      })
      .end();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const getQRCode = async (req, res) => {
  try {
    const { error, value } = validation.getQRCode(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { QrCode } = value;

    const credentials = new AWS.Credentials({
      accessKeyId: constant.s3Creds.accessKey,
      secretAccessKey: constant.s3Creds.secret,
    });
    AWS.config.credentials = credentials;

    const s3 = new AWS.S3({
      credentials: credentials,
    });

    const params = {
      Bucket: constant.s3Creds.bucket,
      Key: "asnQrcodes/" + QrCode,
    };

    s3.getObject(params, (err, data) => {
      if (err) {
        return res.json({
          error: true,
          message: "Failed to fetch QRCoce.",
          data: [],
        });
      } else {
        const fileBuffer = data.Body;
        const imageBuffer = fileBuffer.toString("base64");
        return res.json({
          error: false,
          message: "QRCode fetched.",
          data: imageBuffer,
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const workFlowStatus = async (req, res) => {
  try {
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

    const { error, value } = validation.workFlowStatus(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { text } = value;

    let obj;
    try {
      const secret = constant.jwtConfig.secret;

      const decryptedData = CryptoJS.AES.decrypt(text, secret).toString(
        CryptoJS.enc.Utf8
      );

      eval("obj = " + decryptedData);
    } catch (error) {
      return res.json({
        error: true,
        message: "Wrong QRCode.",
      });
    }

    const { id, departmentId, type } = obj;

    //check if status is shipped or not
    const checkShippedStatus = await knex("asns")
      .where({ id: id })
      .select("status");

    if (type == "ZSER") {
      if (checkShippedStatus.length <= 0) {
        return res.json({
          error: true,
          message: "SCR does not exist.",
        });
      }
    } else {
      if (checkShippedStatus.length <= 0) {
        return res.status(404).json({
          error: true,
          message: "ASN does not exist.",
        });
      }
    }

    const userDepid = await knex("users")
      .where({ id: statusChangerId })
      .select("approverofdept");
    const finalDepId = userDepid[0].approverofdept;

    if (userDepid.length <= 0) {
      return res
        .status(404)
        .json({
          error: true,
          message: "department id of user not found",
        })
        .end();
    }

    // if (departmentId != finalDepId) {
    //   return res
    //     .json({
    //       error: true,
    //       message: "Department does not match",
    //     })
    //     .end();
    // }

    const getData = async (asnid) => {
      let data = await knex("asns").where({ id: asnid });
      data[0].lineItems = JSON.parse(data[0].lineItems);

      return data[0];
    };

    const getTimeLine = async (id, type) => {
      let getTimeLine = [];
      if (type == "ZSER") {
        const checkScr = await knex("scrStatusTimeline").where("asn_id", id);

        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex("scrStatusTimeline")
            .select({
              Intial_User: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              Intial_Time: "scrStatusTimeline.requestedTime",
              Intial_Status: "scrStatusTimeline.requestedStatus",
              Standard_Department_User: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              AcceptedTime: "scrStatusTimeline.acceptedTime",
              Status1: "scrStatusTimeline.acceptedStatus",
              Accounts_Executive: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              InvoicedTime: "scrStatusTimeline.invoicedTime",
              Status2: "scrStatusTimeline.invoicedStatus",
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              "scrStatusTimeline.requested"
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              "scrStatusTimeline.accepted"
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              "scrStatusTimeline.invoiced"
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].Intial_User,
              TIme: getTimeLine[0].Intial_Time,
              Status: getTimeLine[0].Intial_Status,
            },
            {
              Name: getTimeLine[0].Standard_Department_User,
              Time: getTimeLine[0].AcceptedTime,
              Status: getTimeLine[0].Status1,
            },
            {
              Name: getTimeLine[0].Accounts_Executive,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status2,
            },
          ];

          getTimeLine = [];
          getTimeLine.push(data);
        }
      } else {
        const tableName = "asnStatusTimeline";
        const checkScr = await knex(tableName).where("asn_id", id);
        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex(tableName)
            .select({
              MaterialShipped: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              MaterialShippedTime: `${tableName}.MaterialShippedTime`,
              Status: `${tableName}.MaterialShippedStatus`,
              MaterialGateInward: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              MaterialGateInwardTime: `${tableName}.MGITime`,
              Status1: `${tableName}.MaterialGateInwardStatus`,

              MaterialReceived: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              MaterialReceivedTime: `${tableName}.MaterialReceivedTime`,
              Status2: `${tableName}.MaterialReceivedStatus`,

              QualityApproved: knex.raw(
                "CONCAT(users3.firstname, ' ', users3.lastname)"
              ),
              QualityApprovedTime: `${tableName}.QualityApprovedTime`,
              Status3: `${tableName}.QualityApprovedStatus`,
              Invoiced: knex.raw(
                "CONCAT(users4.firstname, ' ', users4.lastname)"
              ),
              InvoicedTime: `${tableName}.InvoicedTime`,
              Status4: `${tableName}.InvoicedStatus`,
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              `${tableName}.MaterialShipped`
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              `${tableName}.MaterialGateInward`
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              `${tableName}.MaterialReceived`
            )
            .leftJoin(
              "users as users3",
              "users3.id",
              "=",
              `${tableName}.QualityApproved`
            )
            .leftJoin(
              "users as users4",
              "users4.id",
              "=",
              `${tableName}.Invoiced`
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].MaterialShipped,
              Time: getTimeLine[0].MaterialShippedTime,
              Status: getTimeLine[0].Status,
            },
            {
              Name: getTimeLine[0].MaterialGateInward,
              Time: getTimeLine[0].MaterialGateInwardTime,
              Status: getTimeLine[0].Status1,
            },
            {
              Name: getTimeLine[0].MaterialReceived,
              Time: getTimeLine[0].MaterialReceivedTime,
              Status: getTimeLine[0].Status2,
            },
            {
              Name: getTimeLine[0].QualityApproved,
              Time: getTimeLine[0].QualityApprovedTime,
              Status: getTimeLine[0].Status3,
            },
            {
              Name: getTimeLine[0].Invoiced,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status4,
            },
          ];
          getTimeLine = [];
          getTimeLine.push(data);
        }
      }
      return getTimeLine[0];
    };

    switch (checkShippedStatus[0].status) {
      case "materialShipped":
        if (statusChanger === "Security Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "materialGateInward");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const asnDetail = await getData(id);

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              MaterialGateInward: statusChangerId,
              MGITime: timeStamp,
              MaterialGateInwardStatus: "Material Gate Inward",
            });
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }

          const timeline = await getTimeLine(id, type);

          return res.status(200).json({
            error: false,
            message: "Status changed.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.status(500).json({
            error: false,
            message: "Invalid status changer for materialInward status",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "materialGateInward":
        if (statusChanger === "Store Keeper") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "materialReceived");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const asnDetail = await getData(id);

          const timeStamp1 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              MaterialReceived: statusChangerId,
              MaterialReceivedTime: timeStamp1,
              MaterialReceivedStatus: "Material Received",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }

          const timeline = await getTimeLine(id, type);

          return res.status(200).json({
            error: false,
            message: "Status changed.",
            editable: 1,
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.status(409).json({
            error: true,
            message: "Status already changed",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "materialReceived":
        if (statusChanger === "Quality Incharge") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "qualityApproved");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const asnDetail = await getData(id);

          const timeStamp2 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              QualityApproved: statusChangerId,
              QualityApprovedTime: timeStamp2,
              QualityApprovedStatus: "Quality Approved",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",

              data: asnDetail,
            });
          }
          const timeline = await getTimeLine(id, type);
          return res.status(200).json({
            error: false,
            message: "Status changed.",
            timeline: timeline,
            data: asnDetail,
          });
        } else if (statusChanger === "Accounts Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }
          const asnDetail = await getData(id);

          const timeStamp3 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",

              data: asnDetail,
            });
          }

          const timeline = await getTimeLine(id, type);

          return res.status(200).json({
            error: false,
            message: "Status changed.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.status(500).json({
            error: true,
            message: "Invalid status changer for Quality Check status",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "qualityApproved":
        if (statusChanger === "Accounts Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }
          const asnDetail = await getData(id);

          const timeStamp3 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }

          const timeline = await getTimeLine(id, type);
          return res.status(200).json({
            error: false,
            message: "Status changed.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.status(500).json({
            error: true,
            message: "Invalid status changer for Invoice status",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "requested":
        if (
          statusChanger === "Service Department User" &&
          departmentId == finalDepId
        ) {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "accepted");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }
          const asnDetail = await getData(id);

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("scrStatusTimeline")
            .update({
              asn_id: id,
              SDUid: departmentId,
              accepted: statusChangerId,
              acceptedTime: timeStamp,
              acceptedStatus: "Accepted",
            })
            .where("asn_id", id);
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }

          const timeline = await getTimeLine(id, type);

          return res.status(200).json({
            error: false,
            message: "Status changed.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.status(401).json({
            error: true,
            message: "This department user cant change status requested.",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "accepted":
        if (statusChanger === "Accounts Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }
          const asnDetail = await getData(id);

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("scrStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: false,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }

          const timeline = await getTimeLine(id, type);
          return res.status(200).json({
            error: false,
            message: "Status changed.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.status(401).json({
            error: false,
            message: "This department user cant change status accepted.",
            timeline: timeline,
            data: asnDetail,
          });
        }

      default:
        const asnDetail = await getData(id);
        const timeline = await getTimeLine(id, type);
        // Handle unknown checkShippedStatus
        return res.status(401).json({
          error: false,
          message: "You can't change status.",
          timeline: timeline,
          data: asnDetail,
        });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const asnMaterialReceived = async (req, res) => {
  try {
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
    const permissions = payload.permissions;
    if (permissions.length <= 1) {
      return res.json({
        error: true,
        message: "You are not authorized to change status.",
      });
    }

    const { error, value } = validation.asnMaterialReceived(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    let {
      asn_id = null,
      id,
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      status,
      file,
      eWayBillNo,
      departmentId,
      MaterialGateInwardRemarks,
      MaterialReceivedRemarks,
      InvoicedRemarks,
      QualityApprovedRemarks,
      vehicalDetails,
      editable = "1",
      invoiceType,
      baseLineDate,
      companyPAN,
      companyGST,
      grnId,
      sesId,
      giId,
      storageLocation,
      // totalAmount,
    } = value.qrdata;

    let {
      vehicalNo,
      arrivalDate,
      arrivalTime,
      comeFrom,
      driverFullName,
      driverLicenceNo,
      vehicalStatus,
      logisticCoName,
      gateInwardLocation,
      vehicalInwardPurpose,
      transporterName,
      transporterId,
      transDocNo,
      transDocDate,
      // plant_id,
    } = value.vehical;

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    if (dispatchDate > currentDateIST) {
      return res.status(400).json({
        error: true,
        message: "Can't accept before dispatch date.",
      });
    }

    let Zero = 0;
    lineItems.forEach((item, index) => {
      if (item.Quantity == 0) {
        Zero += 1;
      }
    });

    if (Zero == lineItems.length) {
      return res.status(400).json({
        error: true,
        message: "Can't set all Quantities to 0",
      });
    }

    let getType = "ASN";
    if (type == "ZSER") {
      getType = "SCR";
      status = "requested";
      const asnNo2 = asnNo.replace(/^.{3}/, "SCR");
      asnNo = asnNo2;
      let Obj = [];
      let li = [];
      lineItems.map((item) => {
        const serviceName = item.itemName;
        delete lineItems[0]["itemName"];
        li.push({ serviceName: serviceName, ...lineItems[0] });
      });
      lineItems = [];
      lineItems = li;

      //if you want to not show blank fields
      // lineItems.map((item) => {
      //   Obj.push(Object.keys(item));
      // });
      // Obj.forEach((item, index) => {
      //   item.map((value, ind) => {
      //     // if (lineItems[index][value] == "") {
      //     //   delete lineItems[index][value];
      //     // }
      //   });
      // });
    }

    const lineItemsForStock = lineItems;
    const lineItemsValue = JSON.stringify(lineItems);

    // const todaysDate = new Date().getDate() + "";
    // const todaysMonth = new Date().getMonth() + 1 + "";
    // const todaysYear = new Date().getFullYear() + "";

    // const currentDate = new Date(
    //   stringToDate(todaysDate + "-" + todaysMonth + "-" + todaysYear)
    // );

    const dispatchDateIs = new Date(stringToDate(dispatchDate));
    const arrivalDateIs = new Date(stringToDate(arrivalDate));
    // console.log(currentDate, dispatchDateIs);

    if (dispatchDateIs > arrivalDateIs) {
      return res.status(400).json({
        error: true,
        message: "Arrival date should not be less than dispatch date",
      });
    }

    const checkDeptId = await knex("departments")
      .where("id", departmentId)
      .first();

    if (checkDeptId == undefined) {
      return res.status(404).json({
        error: true,
        message: "Department not found",
      });
    }
    let asnId;
    if (asn_id) {
      asnId = asn_id;
    } else {
      asnId = id;
    }

    const checkShippedStatus = await knex("asns")
      .where({ id: asnId })
      .select("status");
    if (checkShippedStatus.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "ASN does not exist",
      });
    }

    const sapData = {
      asn_id: asnId,
      poNo,
      poDate,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      status,
      file,
      eWayBillNo,
      departmentId,
      MaterialGateInwardRemarks,
      MaterialReceivedRemarks,
      InvoicedRemarks,
      QualityApprovedRemarks,
      vehicalDetails,
      editable,
      invoiceType,
      baseLineDate,
      companyPAN,
      companyGST,
      grnId,
      sesId,
      giId,
      storageLocation,
    };

    const getUserId = await knex("users")
      .where(
        "email",
        knex("supplier_details")
          .select("emailID")
          .where("sap_code", supplierId)
          .first()
      )
      .first();
    console.log(getUserId.id);

    switch (checkShippedStatus[0].status) {
      case "materialShipped":
        if (statusChanger === "Security Executive") {
          if (
            storageLocation == null ||
            storageLocation == "" ||
            storageLocation == undefined
          ) {
            return res.json({
              error: true,
              message: "Storage Location is required.",
            });
          }
          const checkStorageLocation = await knex("storage_locations").where(
            "id",
            storageLocation
          );
          if (checkStorageLocation.length <= 0) {
            return res.status(404).json({
              error: true,
              message: "Storage Location not found.",
            });
          }
          const getPlantsDetails = await knex("plants")
            .where({ id: comeFrom })
            .select("name");
          if (getPlantsDetails.length <= 0) {
            return res.status(404).json({
              error: true,
              message: "Plant doest not exist",
            });
          }

          let currentDate = new Date();
          let year = currentDate.getFullYear();
          let month = currentDate.getMonth() + 1;
          let day = currentDate.getDate();
          month = month < 10 ? "0" + month : month;
          day = day < 10 ? "0" + day : day;

          const gateInwardNumber2 = `GW-${year}${month}${day}-${asnNo.slice(
            3
          )}`;
          const updateStatus = await knex("asns")
            .where({ id: asnId })
            .update("status", "materialGateInward");
          const insertVehicalDetails = await knex("vehicals").insert({
            asn_id: asnId,
            vehicalNo,
            arrivalDate,
            arrivalTime,
            comeFrom,
            driverFullName,
            driverLicenceNo,
            vehicalStatus,
            logisticCoName,
            gateInwardLocation,
            vehicalInwardPurpose,
            transporterName,
            transporterId,
            transDocNo,
            transDocDate,
            // plant: plant_id,
            status: "Inward",
            gateInwardNumber: gateInwardNumber2,
            statusTime: knex.fn.now(),
          });

          if (!insertVehicalDetails) {
            return res.status(500).json({
              error: true,
              message: "Vehicle details could not be inserted",
            });
          }

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: asnId })
            .update({
              asn_id: asnId,
              MaterialGateInward: statusChangerId,
              MGITime: timeStamp,
              MaterialGateInwardStatus: "Material Gate Inward",
              MaterialGateInwardRemarks: remarks,
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          const insertASN = await knex("asnMaterialReceived")
            .update({
              asn_id: asnId,
              poNo,
              poDate,
              asnNo,
              plantId,
              supplierId,
              dispatchDate,
              type,
              carrier,
              lineItems: lineItemsValue,
              status: "materialGateInward",
              gst,
              pan,
              irnNo,
              gstInvoiceNumber,
              shipToAddress,
              billToAddress,
              remarks,
              file,
              eWayBillNo,
              departmentId,
              remarks,
              MaterialGateInwardRemarks,
              MaterialReceivedRemarks,
              QualityApprovedRemarks,
              InvoicedRemarks,
              invoiceType,
              storageLocation,
            })
            .where("asn_id", asnId);
          if (!insertASN) {
            return res.status(500).json({
              error: true,
              message: "ASN update failed.",
            });
          }
          // const GIentry = await sap.gi(sapData);
          // if (GIentry.error) {
          //   return res.json({
          //     error: true,
          //     message: "Gate Inward Entry Done on Portal.",
          //   });
          // }

          const insertNotification = await notification.createNotification(
            [statusChangerId, getUserId.id],
            "Material Gate Inwarded !",
            `Material Gate Inward entry done for ASN: ${asnNo}`,
            "0"
          );

          return res.status(200).json({
            error: false,
            message: "Material Gate Inward Entry Done.",
            vehicleid: insertVehicalDetails,
            asnMaterialReceived: insertASN,
          });
        } else if (statusChanger === "Store Keeper") {
          const getRole = await knex("users_roles").where(
            "role_name",
            "=",
            "Security Executive"
          );
          if (
            getRole.length > 0 ||
            getRole[0].role_name == "Security Executive"
          ) {
            return res.status(409).json({
              error: true,
              message: "Gate Inward Entry is Pending",
            });
          }
          const getStock = await knex("poStock").where("poNo", poNo);
          if (getStock.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "Failed to fetch stock and status not updated.",
            });
          }
          if (
            storageLocation == null ||
            storageLocation == "" ||
            storageLocation == undefined
          ) {
            return res.status(500).json({
              error: true,
              message: "Storage Location is required.",
            });
          }

          getStock[0].poQty = JSON.parse(getStock[0].poQty);
          getStock[0].remaining = JSON.parse(getStock[0].remaining);
          getStock[0].asnQty = JSON.parse(getStock[0].asnQty);

          let asnQty = [];
          let remaining = [];
          let status = "materialReceived";
          lineItemsForStock.forEach((item, index) => {
            if (
              getStock[0].poQty[index].itemName == item.itemName ||
              getStock[0].poQty[index].itemName == item.serviceName
            ) {
              const temp =
                parseInt(item.previousQuantity) - parseInt(item.Quantity);
              const asnqtty = parseInt(getStock[0].asnQty[index]) - temp;
              const remainingqtty =
                parseInt(getStock[0].poQty[index].Quantity) - asnqtty;
              asnQty.push(asnqtty);
              remaining.push(remainingqtty);
              if (item.previousQuantity > item.Quantity) {
                status = "partiallyReceived";
              }
            }
          });
          const data = {
            asnQty: JSON.stringify(asnQty),
            remaining: JSON.stringify(remaining),
          };
          const updatepoStock = await knex("poStock")
            .update(data)
            .where("poNo", poNo);
          if (updatepoStock <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update stock and status not changed.",
            });
          }

          const updateStatus = await knex("asns")
            .where({ id: asnId })
            .update("status", status);

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp1 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: asnId })
            .update({
              asn_id: asnId,
              MaterialReceived: statusChangerId,
              MaterialReceivedTime: timeStamp1,
              MaterialReceivedStatus: status,
              MaterialReceivedRemarks: remarks,
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          const updateASN = await knex("asnMaterialReceived")
            .update({
              poNo,
              poDate,
              asnNo,
              plantId,
              supplierId,
              dispatchDate,
              type,
              carrier,
              lineItems: lineItemsValue,
              status: status,
              gst,
              pan,
              irnNo,
              gstInvoiceNumber,
              shipToAddress,
              billToAddress,
              remarks,
              file,
              eWayBillNo,
              departmentId,
              remarks,
              MaterialGateInwardRemarks,
              MaterialReceivedRemarks,
              QualityApprovedRemarks,
              InvoicedRemarks,
              invoiceType,
              storageLocation,
            })
            .where("asn_id", asnId);
          if (!updateASN) {
            return res.status(500).json({
              error: true,
              message: "ASN could not submited",
            });
          }

          //Dont remove this code
          // const poDetails = await fun.fetchPODetails(poNo);
          // const items = JSON.parse(lineItems);
          // let ITEM = [];
          // const UNIQUE_TRANSACTION_ID = uuidv4();
          // items.forEach((i) => {
          //   ITEM.push({
          //     MATERIAL_NO: i.material,
          //     STORAGE_LOC: i.storageLocation,
          //     QUANTITY: i.Quantity,
          //     UOM: i.uom,
          //     STOCK_TYPE: "",
          //     SPECIAL_STOCK_INDICATOR: poDetails.PO_ITEMS.SPEC_STOCK,
          //     PO_ITEM: i.poItem,
          //     PO_NUMBER: poNo,
          //   });
          // });
          // result2.push({
          //   UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
          //   POSTING_DATE: `${fromDate}`,
          //   ITEM: ITEM,
          //   DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
          //   COMPANY_CODE: poDetails.PO_HEADER.CO_CODE,
          //   BATCH_NO: `${poDetails.PO_ITEM_SCHEDULES.BATCH}`,
          //   TIME_STAMP: `${new Date().toISOString().split("T")[1]}`,
          // });
          // // const getGrn = await knex("grns")
          // //   .where({ asn_id: item.id })
          // //   .andWhere({ poNo: item.poNo });
          // // if (getGrn <= 0) {
          // const currentDateIST = moment
          //   .tz("Asia/Kolkata")
          //   .format("YYYY-MM-DD HH:mm:ss");
          // const insertGrn = await knex("grns").insert({
          //   poNo: poNo,
          //   asn_id: asnId,
          //   grnUniqueId: UNIQUE_TRANSACTION_ID,
          //   postingDate: fromDate,
          //   item: JSON.stringify(ITEM),
          //   documentDate: poDetails.PO_HEADER.DOC_DATE,
          //   companyCode: poDetails.PO_HEADER.CO_CODE,
          //   batchNo: poDetails.PO_ITEM_SCHEDULES.BATCH,
          //   created_at: currentDateIST,
          // });
          // const updateInScr = await knex("asns")
          //   .update({ grnId: insertGrn })
          //   .where({ id: asnId });

          // const GRN = await sap.grn(sapData);
          // if (GRN.error) {
          //   return res.json({
          //     error: false,
          //     message: "Material Received Successfully on Portal.",
          //     editable: 1,
          //   });
          // }
          return res.status(200).json({
            error: false,
            message: "Material Received Successfully.",
            editable: 1,
          });
        } else {
          return res.status(403).json({
            error: true,
            message:
              "You don't have permission for Gate Inward and Receiving Material.",
          });
        }

      case "materialGateInward":
        if (statusChanger === "Store Keeper") {
          // if (
          //   storageLocation == null ||
          //   storageLocation == "" ||
          //   storageLocation == undefined
          // ) {
          //   return res.json({
          //     error: true,
          //     message: "Storage Location is required.",
          //   });
          // }
          const getStock = await knex("poStock").where("poNo", poNo);
          if (getStock.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "Failed to fetch stock and status not updated.",
            });
          }

          getStock[0].poQty = JSON.parse(getStock[0].poQty);
          getStock[0].remaining = JSON.parse(getStock[0].remaining);
          getStock[0].asnQty = JSON.parse(getStock[0].asnQty);

          let asnQty = [];
          let remaining = [];
          let status = "materialReceived";
          lineItemsForStock.forEach((item, index) => {
            if (
              getStock[0].poQty[index].itemName == item.itemName ||
              getStock[0].poQty[index].itemName == item.serviceName
            ) {
              const temp =
                parseInt(item.previousQuantity) - parseInt(item.Quantity);
              const asnqtty = parseInt(getStock[0].asnQty[index]) - temp;
              const remainingqtty =
                parseInt(getStock[0].poQty[index].Quantity) - asnqtty;
              asnQty.push(asnqtty);
              remaining.push(remainingqtty);
              if (item.previousQuantity > item.Quantity) {
                status = "partiallyReceived";
              }
            }
          });
          const data = {
            asnQty: JSON.stringify(asnQty),
            remaining: JSON.stringify(remaining),
          };
          const updatepoStock = await knex("poStock")
            .update(data)
            .where("poNo", poNo);
          if (updatepoStock <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update stock and status not changed.",
            });
          }

          const updateStatus = await knex("asns")
            .where({ id: asnId })
            .update("status", status);

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp1 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: asnId })
            .update({
              asn_id: asnId,
              MaterialReceived: statusChangerId,
              MaterialReceivedTime: timeStamp1,
              MaterialReceivedStatus: status,
              MaterialReceivedRemarks: remarks,
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          const updateASN = await knex("asnMaterialReceived")
            .update({
              poNo,
              poDate,
              asnNo,
              plantId,
              supplierId,
              dispatchDate,
              type,
              carrier,
              lineItems: lineItemsValue,
              status: status,
              gst,
              pan,
              irnNo,
              gstInvoiceNumber,
              shipToAddress,
              billToAddress,
              remarks,
              file,
              eWayBillNo,
              departmentId,
              remarks,
              MaterialGateInwardRemarks,
              MaterialReceivedRemarks,
              QualityApprovedRemarks,
              InvoicedRemarks,
              invoiceType,
              // storageLocation,
            })
            .where("asn_id", asnId);
          if (!updateASN) {
            return res.status(500).json({
              error: true,
              message: "ASN could not submited",
            });
          }

          // const GRN = await sap.grn(sapData);
          // console.log(GRN, "this is GRN");
          // if (GRN.error) {
          //   return res.json({
          //     error: false,
          //     message: "Material Received Successfully on Portal.",
          //     editable: 1,
          //   });
          // }

          const insertNotification = await notification.createNotification(
            [statusChangerId, getUserId.id],
            "Material Received !",
            `Material Received of ASN: ${asnNo}`,
            "0"
          );

          return res.status(200).json({
            error: false,
            message: "Material Received Successfully.",
            editable: 1,
            data: insertNotification,
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "You don't have permission for Receiving Material.",
          });
        }

      case "materialReceived":
      case "partiallyReceived":
        if (statusChanger === "Quality Incharge") {
          const updateStatus = await knex("asns")
            .where({ id: asnId })
            .update({ status: "qualityApproved" });

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp2 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: asnId })
            .update({
              asn_id: asnId,
              QualityApproved: statusChangerId,
              QualityApprovedTime: timeStamp2,
              QualityApprovedStatus: "Quality Approved",
              QualityApprovedRemarks: remarks,
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",

              data: asnDetail,
            });
          }

          const updateASN = await knex("asnMaterialReceived")
            .update({
              poNo,
              poDate,
              asnNo,
              plantId,
              supplierId,
              dispatchDate,
              type,
              carrier,
              lineItems: lineItemsValue,
              status: "qualityApproved",
              gst,
              pan,
              irnNo,
              gstInvoiceNumber,
              shipToAddress,
              billToAddress,
              remarks,
              file,
              eWayBillNo,
              departmentId,
              remarks,
              MaterialGateInwardRemarks,
              MaterialReceivedRemarks,
              QualityApprovedRemarks,
              InvoicedRemarks,
              invoiceType,
            })
            .where("asn_id", asnId);
          if (!updateASN) {
            return res.status(500).json({
              error: true,
              message: "ASN could not submited",
            });
          }

          const insertNotification = await notification.createNotification(
            [statusChangerId, getUserId.id],
            "Quality Checked !",
            `Material quality check done for ASN: ${asnNo}`,
            "0"
          );
          return res.status(200).json({
            error: false,
            message: "Quality Checked Successfully.",
          });
        } else if (statusChanger === "Accounts Executive") {
          // const getRole = await knex("users_roles").where(
          //   "role_name",
          //   "=",
          //   "Quality Incharge"
          // );
          // if (
          //   getRole.length > 0 ||
          //   getRole[0].role_name == "Quality Incharge"
          // ) {
          //   return res.json({
          //     error: true,
          //     message: "Quality check is Pending.",
          //   });
          // }
          if (invoiceType == "" || invoiceType == null) {
            return res.status(400).json({
              error: true,
              message: "Invoice type is a required field",
            });
          }

          if (baseLineDate == "" || baseLineDate == null) {
            return res.status(400).json({
              error: true,
              message: "Baseline date is a required field",
            });
          }
          const updateStatus = await knex("asns").where({ id: asnId }).update({
            status: "invoiced",
            baseLineDate: baseLineDate,
            invoiceType: invoiceType,
          });

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp3 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: asnId })
            .update({
              asn_id: asnId,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
              InvoicedRemarks: remarks,
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          const updateASN = await knex("asnMaterialReceived")
            .update({
              poNo,
              poDate,
              asnNo,
              plantId,
              supplierId,
              dispatchDate,
              type,
              carrier,
              lineItems: lineItemsValue,
              status: "invoiced",
              gst,
              pan,
              irnNo,
              gstInvoiceNumber,
              shipToAddress,
              billToAddress,
              remarks,
              file,
              eWayBillNo,
              departmentId,
              remarks,
              MaterialGateInwardRemarks,
              MaterialReceivedRemarks,
              QualityApprovedRemarks,
              InvoicedRemarks,
              invoiceType,
            })
            .where("asn_id", asnId);
          if (!updateASN) {
            return res.status(500).json({
              error: true,
              message: "ASN could not submited",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Invoiced Successfully.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "You don't have permission for Quality Check.",
          });
        }

      case "qualityApproved":
        if (statusChanger === "Accounts Executive") {
          if (invoiceType == "" || invoiceType == null) {
            return res.status(400).json({
              error: true,
              message: "Invoice type is a required field",
            });
          }
          if (baseLineDate == "" || baseLineDate == null) {
            return res.status(400).json({
              error: true,
              message: "Baseline date is a required field",
            });
          }
          const updateStatus = await knex("asns").where({ id: asnId }).update({
            status: "invoiced",
            baseLineDate: baseLineDate,
            invoiceType: invoiceType,
          });

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp3 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: asnId })
            .update({
              asn_id: asnId,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
              InvoicedRemarks: remarks,
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          const updateASN = await knex("asnMaterialReceived")
            .update({
              poNo,
              poDate,
              asnNo,
              plantId,
              supplierId,
              dispatchDate,
              type,
              carrier,
              lineItems: lineItemsValue,
              status: "invoiced",
              gst,
              pan,
              irnNo,
              gstInvoiceNumber,
              shipToAddress,
              billToAddress,
              remarks,
              file,
              eWayBillNo,
              departmentId,
              remarks,
              MaterialGateInwardRemarks,
              MaterialReceivedRemarks,
              QualityApprovedRemarks,
              InvoicedRemarks,
              invoiceType,
            })
            .where("asn_id", asnId);
          if (!updateASN) {
            return res.status(500).json({
              error: true,
              message: "ASN could not submited",
            });
          }

          const insertNotification = await notification.createNotification(
            [statusChangerId, getUserId.id],
            `${getType} Invoiced !`,
            `${getType} No: ${asnNo} of PO:${poNo} has been Invoiced`,
            "0"
          );

          return res.status(200).json({
            error: false,
            message: "Invoiced Successfully.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "You don't have permission for Invoicing ASN.",
          });
        }

      case "requested":
        if (
          statusChanger === "Service Department User"
          // departmentId == finalDepId
        ) {
          const updateStatus = await knex("asns")
            .where({ id: asnId })
            .update("status", "accepted");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const insertNotification = await notification.createNotification(
            [statusChangerId, getUserId.id],
            `Service Accepted !`,
            `Services of ${getType} No: ${asnNo} of PO:${poNo} has been Accepted`,
            "0"
          );

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("scrStatusTimeline")
            .update({
              asn_id: asnId,
              // SDUid: departmentId,
              accepted: statusChangerId,
              acceptedTime: timeStamp,
              acceptedStatus: "Accepted",
              acceptedRemarks: remarks,
            })
            .where("asn_id", asnId);
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          // const SES = await sap.ses(sapData);
          // console.log(SES,"this is SES")
          // if (SES.error) {
          //   return res.json({
          //     error: false,
          //     message: "SCR Accepted on Portal."
          //    });
          // }

          return res.status(200).json({
            error: false,
            message: "SCR Accepted.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "This department user can't accept SCR.",
          });
        }

      case "accepted":
        if (statusChanger === "Accounts Executive") {
          if (invoiceType == "" || invoiceType == null) {
            return res.status(400).json({
              error: true,
              message: "Invoice type is a required field",
            });
          }
          if (baseLineDate == "" || baseLineDate == null) {
            return res.status(400).json({
              error: true,
              message: "Baseline date is a required field",
            });
          }
          const updateStatus = await knex("asns").where({ id: asnId }).update({
            status: "invoiced",
            baseLineDate: baseLineDate,
            invoiceType: invoiceType,
          });

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const insertNotification = await notification.createNotification(
            [statusChangerId, getUserId.id],
            `${getType} Invoiced !`,
            `${getType} No: ${asnNo} of PO:${poNo} has been Invoiced`,
            "0"
          );
          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("scrStatusTimeline")
            .where({ asn_id: asnId })
            .update({
              asn_id: asnId,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp,
              InvoicedStatus: "Invoiced",
              InvoicedRemarks: remarks,
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Invoiced Successfully.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "You don't have permission for Invoicing SCR.",
          });
        }

      default:
        return res.status(403).json({
          error: true,
          message: "You don't have permission for this.",
        });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

//for vehical details at gatInward
const asnGateInward2 = async (req, res) => {
  try {
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
    const { error, value } = validation.gateInward2(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    // console.log(value.qrcode, "this is qr data");

    let {
      id,
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems,
      status,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      departmentId,
      vehicalDetails,
    } = value.qrdata;

    if (type == "ZSER") {
      status = "requested";
      const asnNo2 = asnNo.replace(/^.{3}/, "SCR");
      asnNo = asnNo2;
      let Obj = [];
      let li = [];
      lineItems.map((item) => {
        const serviceName = item.itemName;
        delete lineItems[0]["itemName"];
        li.push({ serviceName: serviceName, ...lineItems[0] });
      });
      lineItems = [];
      lineItems = li;

      //if you want to not show blank fields
      // lineItems.map((item) => {
      //   Obj.push(Object.keys(item));
      // });
      // Obj.forEach((item, index) => {
      //   item.map((value, ind) => {
      //     // if (lineItems[index][value] == "") {
      //     //   delete lineItems[index][value];
      //     // }
      //   });
      // });
    }

    let currentPOqty = 0;
    const totalPOqty = 1100; //to do : total purchase order qty will come here

    for (const iterator of lineItems) {
      currentPOqty += iterator.orderQuantity;
    }

    // if (currentPOqty != totalPOqty) {
    //   return res.status(400).json({
    //     error: true,
    //     message:
    //       "Total PO quantity should be equal to the sum of order quantities",
    //   });
    // }

    const lineItemsValue = JSON.stringify(lineItems);
    const vehicalDetailsValue = JSON.stringify(vehicalDetails);

    const todaysDate = new Date().getDate() + "";
    const todaysMonth = new Date().getMonth() + 1 + "";
    const todaysYear = new Date().getFullYear() + "";

    const currentDate = new Date(
      stringToDate(todaysDate + "-" + todaysMonth + "-" + todaysYear)
    );

    const dispatchDateIs = new Date(stringToDate(dispatchDate));

    // console.log(currentDate, dispatchDateIs);

    if (dispatchDateIs < currentDate) {
      return res.status(400).json({
        error: true,
        message: "Delivery date should not be less than current date",
      });
    }

    const checkDeptId = await knex("departments")
      .where("id", departmentId)
      .first();

    if (checkDeptId == undefined) {
      return res.status(404).json({
        error: true,
        message: "Department not found",
      });
    }

    const insertASN = await knex("asnMaterialReceived").insert({
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      dispatchDate,
      type,
      carrier,
      lineItems: lineItemsValue,
      vehicalDetails: vehicalDetailsValue,
      status,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      departmentId,
      remarks,
      // MaterialGateInwardRemarks,
      // MaterialReceivedRemarks,
      // QualityApprovedRemarks,
      // InvoicedRemarks,
    });
    if (!insertASN) {
      return res.status(500).json({
        error: true,
        message: "ASN could not submited",
      });
    }

    const checkShippedStatus = await knex("asns")
      .where({ id: id })
      .select("status");

    console.log("this is status", checkShippedStatus);
    console.log("status changer", statusChanger);

    switch (checkShippedStatus[0].status) {
      case "materialShipped":
        if (statusChanger === "Security Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .andWhereNot("status", "cancelled")
            .update("status", "materialGateInward");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              MaterialGateInward: statusChangerId,
              MGITime: timeStamp,
              MaterialGateInwardStatus: "Material Gate Inward",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Status changed.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "Invalid status changer for materialInward status",
          });
        }

      case "materialGateInward":
        if (statusChanger === "Store Keeper") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "materialReceived");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp1 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              MaterialReceived: statusChangerId,
              MaterialReceivedTime: timeStamp1,
              MaterialReceivedStatus: "Material Received",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Status changed.",
            editable: 1,
          });
        } else {
          return res.status(403).json({
            error: true,
            message:
              "Invalid status changer for Stock Receive entry at warehouse status",
          });
        }

      case "materialReceived":
        if (statusChanger === "Quality Incharge") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "qualityApproved");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp2 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              QualityApproved: statusChangerId,
              QualityApprovedTime: timeStamp2,
              QualityApprovedStatus: "Quality Approved",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",

              data: asnDetail,
            });
          }

          return res.status(200).json({
            error: false,
            message: "Status changed.",
          });
        } else if (statusChanger === "Accounts Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp3 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Status changed.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "Invalid status changer for Quality Check status",
          });
        }

      case "qualityApproved":
        if (statusChanger === "Accounts Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          const timeStamp3 = knex.fn.now();
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Status changed.",
          });
        } else {
          return res.status(500).json({
            error: true,
            message: "Invalid status changer for Invoice status",
          });
        }

      case "requested":
        if (
          statusChanger === "Service Department User"
          // departmentId == finalDepId
        ) {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "accepted");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("scrStatusTimeline")
            .update({
              asn_id: id,
              // SDUid: departmentId,
              accepted: statusChangerId,
              acceptedTime: timeStamp,
              acceptedStatus: "Accepted",
            })
            .where("asn_id", id);
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Status changed.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "This department user cant change status requested.",
          });
        }

      case "accepted":
        if (statusChanger === "Accounts Executive") {
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to update the status.",
            });
          }

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const insertIntoHistory = await knex("scrStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.status(500).json({
              error: true,
              message: "failed to insert the history.",
            });
          }

          return res.status(200).json({
            error: false,
            message: "Status changed.",
          });
        } else {
          return res.status(403).json({
            error: true,
            message: "This department user cant change status accepted.",
          });
        }

      default:
        return res.status(500).json({
          error: true,
          message: "You can't change status.",
        });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Unable to change status",
      data: JSON.stringify(error),
    });
  }
};

//---for inserting vehicalDetails in VEHICALS table---//
const asnGateInward = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    // Check if the token is present
    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }

    // Decode the token and extract necessary information
    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const { error, value } = validation.gateInward(req.body);

    if (error) {
      return res.status(500).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      asn_id,
      vehicalNo,
      modalName,
      arrivalDate,
      arrivalTime,
      comeFrom,
      driverFullName,
      driverLicenceNo,
      vehicalStatus,
      logisticCoName,
      gateInwardLocation,
      vehicalInwardPurpose,
      status,
      // plant_id,
    } = value;

    //check if asn exist or not
    const getAsnDetails = await knex("asns").where({ id: asn_id });
    if (getAsnDetails.length <= 0) {
      return res
        .status(404)
        .json({
          error: true,
          message: "ASN does not exist",
        })
        .end();
    }

    //check plant exist or not
    const getPlantsDetails = await knex("plants")
      .where({ id: comeFrom })
      .select("name");
    if (getPlantsDetails.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Plant doest not exist",
      });
    }

    if (statusChanger === "Security Executive") {
      const insertVehicalDetails = await knex("vehicals").insert({
        asn_id,
        vehicalNo,
        modalName,
        arrivalDate,
        arrivalTime,
        comeFrom,
        driverFullName,
        driverLicenceNo,
        vehicalStatus,
        logisticCoName,
        gateInwardLocation,
        vehicalInwardPurpose,
        // plant: plant_id,
        status,
      });

      if (!insertVehicalDetails) {
        return res.status(500).json({
          error: true,
          message: "Vehicle details could not be inserted",
        });
      }
      return res.status(200).json({
        error: false,
        message: "Vehicle details inserted successfully.",
      });
    }
    return res
      .json({
        error: true,
        message: "Only Security Executive can enter this details",
      })
      .end();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

//------old gateinward for inserting vehicalDetails in asnMAterialReceived table---///
// const asnGateInward = async (req, res) => {
//   try {
//     const token = req.headers["authorization"];

//     // Check if the token is present
//     if (!token) {
//       return res.json({
//         error: true,
//         message: "Token is required.",
//       });
//     }

//     // Decode the token and extract necessary information
//     const { jwtConfig } = constant;
//     const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//     const statusChanger = payload.permissions[0];
//     const statusChangerId = payload.id;

//     const vehicalSchema = Joi.object({
//       vehical: Joi.object({
//         vehicalNo: Joi.string(),
//         modelName: Joi.string(),
//         arrivalDate: Joi.string(),
//         arrivalTime: Joi.string(),
//         vehicalCameFromLoc: Joi.string(),
//         vehicalStatus: Joi.string(),
//         logisticsCoName: Joi.string(),
//         driverName: Joi.string(),
//         driverLicenceNo: Joi.string(),
//         gateInwardLoc: Joi.string(),
//         asnNo: Joi.string(),
//       }).required(),
//     });

//     const { error, value } = vehicalSchema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }

//     const {
//       vehical: {
//         vehicalNo,
//         modelName,
//         arrivalDate,
//         arrivalTime,
//         vehicalCameFromLoc,
//         vehicalStatus,
//         logisticsCoName,
//         driverName,
//         driverLicenceNo,
//         gateInwardLoc,
//         asnNo,
//       },
//     } = value;

//     const vehicalDetailsValue = JSON.stringify({
//       vehicalNo,
//       modelName,
//       arrivalDate,
//       arrivalTime,
//       vehicalCameFromLoc,
//       vehicalStatus,
//       logisticsCoName,
//       driverName,
//       driverLicenceNo,
//       gateInwardLoc,
//       asnNo,
//     });
//     console.log("vehical details", vehicalDetailsValue);

//     const insertVehicalDetails = await knex("asnMaterialReceived").insert({
//       vehicalDetails: vehicalDetailsValue,
//     });

//     if (!insertVehicalDetails) {
//       return res.json({
//         error: true,
//         message: "Vehicle details could not be inserted",
//       });
//     }
//     return res.json({
//       error: false,
//       message: "Vehicle details inserted successfully.",
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };

//---without ist time---////
// const scannerHistory = async (req, res) => {
//   try {
//     const token = req.headers["authorization"];
//     if (!token) {
//       return res.json({
//         error: true,
//         message: "Token is required.",
//       });
//     }
//     const { jwtConfig } = constant;
//     const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//     const statusChanger = payload.permissions[0];
//     const statusChangerId = payload.id;

//     const { search } = req.body;

//     let rows = [];

//     switch (statusChanger) {
//       case "Security Executive":
//         rows = await knex("asnStatusTimeline")
//           .where("MaterialGateInward", statusChangerId)
//           .select(
//             `asns.asnNo`,
//             "MGITime as Time",
//             "MaterialGateInwardStatus as Status",
//             "MaterialGateInwardRemarks as Remarks",
//             "asn_id"
//           )
//           .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
//         break;

//       case "Store Keeper":
//         rows = await knex("asnStatusTimeline")
//           .where("MaterialReceived", statusChangerId)
//           .select(
//             `asns.asnNo`,
//             "MaterialReceivedTime as Time",
//             "MaterialReceivedStatus as Status",
//             "asn_id"
//           )
//           .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
//         break;

//       case "Quality Incharge":
//         rows = await knex("asnStatusTimeline")
//           .where("QualityApproved", statusChangerId)
//           .select(
//             `asns.asnNo`,
//             "QualityApprovedTime as Time",
//             "QualityApprovedStatus as Status",
//             "asn_id"
//           )
//           .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
//         break;

//       case "Accounts Executive":
//         rows = await knex("asnStatusTimeline")
//           .where("Invoiced", statusChangerId)
//           .select(
//             `asns.asnNo`,
//             "InvoicedTime as Time",
//             "InvoicedStatus as Status",
//             "asn_id"
//           )
//           .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
//         const rows2 = await knex("scrStatusTimeline")
//           .where("Invoiced", statusChangerId)
//           .select(
//             `asns.asnNo`,
//             "InvoicedTime as Time",
//             "InvoicedStatus as Status",
//             "asn_id"
//           )
//           .leftJoin("asns", "asns.id", "=", "scrStatusTimeline.asn_id");
//         rows.push(...rows2);
//         break;

//       case "Service Department User":
//         rows = await knex("scrStatusTimeline")
//           .where("accepted", statusChangerId)
//           .select(
//             `asns.asnNo`,
//             "acceptedTime as Time",
//             "acceptedStatus as Status",
//             "asn_id"
//             //"MaterialGateInwardRemarks"
//           )
//           .leftJoin("asns", "asns.id", "=", "scrStatusTimeline.asn_id");
//         break;

//       default:
//         break;
//     }

//     // Convert UTC time to IST
//     rows = rows.map((row) => {
//       if (row.Time) {
//         const utcTime = new Date(row.Time);
//         const istTime = new Date(
//           utcTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//         );
//         row.Time = istTime.toISOString(); // Convert back to ISO string for consistency
//       }
//       return row;
//     });

//     return res.json({
//       error: false,
//       message: "Data fetched successfully.",
//       data: rows,
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: error.message,
//     });
//   }
// };

//----with ist time--///
const scannerHistory = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(500).json({
        error: true,
        message: "Token is required.",
      });
    }
    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;

    const searchFrom = ["asnNo"];

    const { error, value } = validation.scannerHistory(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let { offset, limit, order, sort, search, status, filter } = value;

    let rows = [];
    let results = [];

    let tableName = "asnStatusTimeline";

    if (statusChanger == "Service Department User") {
      tableName = "scrStatusTimeline";
    }

    switch (statusChanger) {
      case "Security Executive":
        rows = knex("asnStatusTimeline")
          .where("MaterialGateInward", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(MGITime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "MaterialGateInwardStatus as Status",
            "MaterialGateInwardRemarks as Remarks",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id")
          .orderBy("MGITime", "desc");

        results = knex("asnStatusTimeline")
          .where("MaterialGateInward", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(MGITime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "MaterialGateInwardStatus as Status",
            "MaterialGateInwardRemarks as Remarks",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
        break;

      case "Store Keeper":
        rows = knex("asnStatusTimeline")
          .where("MaterialReceived", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(MaterialReceivedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "MaterialReceivedStatus as Status",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id")
          .orderBy("MaterialReceivedTime", "desc");

        results = knex("asnStatusTimeline")
          .where("MaterialReceived", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(MaterialReceivedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "MaterialReceivedStatus as Status",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
        break;

      case "Quality Incharge":
        rows = knex("asnStatusTimeline")
          .where("QualityApproved", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(QualityApprovedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "QualityApprovedStatus as Status",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id")
          .orderBy("QualityApprovedTime", "desc");

        results = knex("asnStatusTimeline")
          .where("QualityApproved", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(QualityApprovedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "QualityApprovedStatus as Status",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
        break;

      case "Accounts Executive":
        // Define the unioned query as a subquery
        const unionedQuery = knex.raw(`
(SELECT ${tableName}.id, asns.asnNo, DATE_FORMAT(CONVERT_TZ(InvoicedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time, 
InvoicedStatus as Status, asn_id, created_at as createdAt, updated_at as updatedAt
FROM asnStatusTimeline
LEFT JOIN asns ON asns.id = asnStatusTimeline.asn_id
WHERE Invoiced = ${statusChangerId}
UNION ALL
SELECT scrStatusTimeline.id, asns.asnNo, DATE_FORMAT(CONVERT_TZ(InvoicedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time, 
InvoicedStatus as Status, asn_id, created_at as createdAt, updated_at as updatedAt
FROM scrStatusTimeline
LEFT JOIN asns ON asns.id = scrStatusTimeline.asn_id
WHERE Invoiced = ${statusChangerId}
) AS combined_query`);

        results = knex.select("*").from(unionedQuery);
        rows = knex.select("*").from(unionedQuery);
        break;

      case "Service Department User":
        rows = knex("scrStatusTimeline")
          .where("accepted", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(acceptedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "acceptedStatus as Status",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "scrStatusTimeline.asn_id")
          .orderBy("acceptedTime", "desc");

        results = knex("scrStatusTimeline")
          .where("accepted", statusChangerId)
          .select(
            `${tableName}.id`,
            `asns.asnNo`,
            knex.raw(
              "DATE_FORMAT(CONVERT_TZ(acceptedTime, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') as Time"
            ),
            "acceptedStatus as Status",
            "asn_id",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .leftJoin("asns", "asns.id", "=", "scrStatusTimeline.asn_id");
        break;

      default:
        break;
    }

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

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDate = moment(filter.startDate)
          .startOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(filter.endDate)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        results.whereBetween(dateField, [startDate, endDate]);
      }
    }

    if (statusChanger == "Accounts Executive") {
      console.log("here");
      total = await results.count(`id as total`).first();
    } else {
      total = await results.count(`${tableName}.id as total`).first();
    }

    if (status != undefined && status != "") {
      rows.where("status", status);
    }
    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.andWhereILike(element, `%${search}%`);
        });
      }
    });
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDate = moment(filter.startDate)
          .startOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(filter.endDate)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        rows.whereBetween(dateField, [startDate, endDate]);
      }
    }
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
      message: "Data fetched successfully.",
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

//for outward
const updateVehicalStatus = async (req, res) => {
  const token = req.headers["authorization"];
  // Check if the token is present
  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Token is required.",
    });
  }
  // console.log("this is token",token);

  // Decode the token and extract necessary information
  const { jwtConfig } = constant;
  const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
  const statusChanger = payload.permissions[0];
  const statusChangerId = payload.id;
  console.log("status changer", statusChanger);
  const { error, value } = validation.updateVehicalStatus(req.body);
  if (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
  const { vehicalNo, asn_id, status } = value;

  //check if asn_id exist in asns
  const checkAsnId = await knex("asns").where({ id: asn_id }).first();
  if (checkAsnId <= 0) {
    return res.status(404).json({
      error: true,
      message: "asn not found",
    });
  }
  //check vehical no exist
  const vehicalNoCheck = await knex("vehicals").where({ vehicalNo: vehicalNo });
  if (vehicalNoCheck.length <= 0) {
    return res
      .status(404)
      .json({
        error: true,
        message: "Vehical no does not exist",
      })
      .end();
  }

  //check if asnstatus is materialshipped
  const getAsnStatus = await knex("asns")
    .where({ id: asn_id })
    .select("status");
  // console.log("this", getAsnStatus);
  if (getAsnStatus.length <= 0) {
    return res.status(500).json({
      error: true,
      message: "Material status is not received",
    });
  }
  if (getAsnStatus) {
    //role check
    if (statusChanger === "Security Executive") {
      const updateVehicalDetails = await knex("vehicals")
        .where({ vehicalNo: vehicalNo })
        .update("status", status);
      if (updateVehicalDetails <= 0) {
        return res
          .status(500)
          .json({
            error: true,
            message: "cant update status",
          })
          .end();
      }
      return res
        .status(200)
        .json({
          error: false,
          message: "Status updated successfully",
        })
        .end();
    }
  }
};

const cancelASN = async (req, res) => {
  try {
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
    const email = payload.email;

    const { error, value } = validation.cancelASN(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.message,
      });
    }
    const { asn_id, remarks } = value;

    const getSuppId = await knex("supplier_details")
      .select("sap_code")
      .where("emailID", email);
    if (getSuppId.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist.",
      });
    }

    const getAsnStatus = await knex("asns")
      .select("status", "poNo", "lineItems", "type")
      .where("id", asn_id)
      .andWhere("supplierId", getSuppId[0].sap_code);
    if (getAsnStatus.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "ASN does not exist.",
      });
    }

    if (
      getAsnStatus[0].status == "materialShipped" ||
      getAsnStatus[0].status == "requested"
    ) {
      if (getAsnStatus[0].type != "ZSER") {
        const cancelASN = await knex("asns")
          .update("status", "cancelled")
          .where("id", asn_id)
          .andWhere("supplierId", getSuppId[0].sap_code);
        const cancelASNMaterialReceived = await knex("asnMaterialReceived")
          .update("status", "cancelled")
          .where("asn_id", asn_id)
          .andWhere("supplierId", getSuppId[0].sap_code);
        if (!cancelASN || !cancelASNMaterialReceived) {
          return res.status(500).json({
            error: true,
            message: "Failed to cancel asn.",
          });
        }
      } else {
        const cancelASN = await knex("asns")
          .update("status", "cancelled")
          .where("id", asn_id)
          .andWhere("supplierId", getSuppId[0].sap_code);

        if (cancelASN.length <= 0) {
          return res.status(500).json({
            error: true,
            message: "Failed to cancel asn.",
          });
        }
      }

      let updateTimeLine = [];
      if (getAsnStatus[0].type == "ZSER") {
        updateTimeLine = await knex("scrStatusTimeline")
          .update({
            Cancel: statusChangerId,
            CancelTime: knex.fn.now(),
            CancelStatus: "cancelled",
            CancelRemarks: remarks,
          })
          .where("asn_id", asn_id);
      } else {
        updateTimeLine = await knex("asnStatusTimeline")
          .update({
            Cancel: statusChangerId,
            CancelTime: knex.fn.now(),
            CancelStatus: "cancelled",
            CancelRemarks: remarks,
          })
          .where("asn_id", asn_id);
      }

      const getStock = await knex("poStock").where(
        "poNo",
        getAsnStatus[0].poNo
      );
      if (getStock.length <= 0) {
        return res.status(500).json({
          error: true,
          message: "Failed to fetch stock.",
        });
      }

      getAsnStatus[0].lineItems = JSON.parse(getAsnStatus[0].lineItems);
      getStock[0].poQty = JSON.parse(getStock[0].poQty);
      getStock[0].asnQty = JSON.parse(getStock[0].asnQty);
      getStock[0].remaining = JSON.parse(getStock[0].remaining);

      let remaining = [];
      let asnQty = [];
      getAsnStatus[0].lineItems.forEach((item, index) => {
        if (
          (getStock[0].poQty[index].itemName == item.itemName ||
            getStock[0].poQty[index].itemName == item.serviceName) &&
          parseInt(getStock[0].poQty[index].Quantity) >= parseInt(item.Quantity)
        ) {
          const temp =
            parseInt(getStock[0].asnQty[index]) - parseInt(item.Quantity);
          const remainingqtty =
            parseInt(getStock[0].poQty[index].Quantity) - temp;
          remaining.push(remainingqtty);
          asnQty.push(temp);
        }
      });

      const updatepoStock = await knex("poStock")
        .update({
          asnQty: JSON.stringify(asnQty),
          remaining: JSON.stringify(remaining),
        })
        .where("poNo", getAsnStatus[0].poNo);
      if (updatepoStock <= 0) {
        return res.status(500).json({
          error: true,
          message: "failed to update stock",
        });
      }

      let getASNType;
      if (getAsnStatus[0].type == "ZSER") {
        getASNType = "SCR";
      } else {
        getASNType = "ASN";
      }

      const createNotification = await notification.createNotification(
        [statusChangerId],
        `${getASNType} Cancelled !`,
        `${getASNType} Cancelled of ${getAsnStatus[0].poNo} and ${getASNType} no: ${getAsnStatus[0].asnNo}`,
        "0"
      );

      return res.status(200).json({
        error: false,
        message: "Asn cancelled and stock updated.",
      });
    }

    return res.status(500).json({
      error: true,
      message: "Can't cancel ASN as It's Shipped.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

function convertUnits(value, fromUnit, toUnit) {
  try {
    return convert(value).from(fromUnit).to(toUnit);
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
}

const unitConversion = async (req, res) => {
  const { error, value } = validation.unitConversion(req.body);

  if (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }

  const { whichvalue, fromUnit, toUnit } = value;

  const convertedValue = convertUnits(whichvalue, fromUnit, toUnit);

  if (!convertedValue) {
    return res.json({
      error: true,
      message: "Conversion failed",
    });
  }

  return res.json({
    error: false,
    message: "Conversion successful",
    convertedValue: convertedValue.toFixed(2), // Round to 2 decimal places
  });
};

const getRemaingQuantity = async (req, res) => {
  try {
    const { error, value } = validation.getRemainQuantity(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.message,
      });
    }

    const { poNo, Quantity } = value;

    const getRemaingQuantity = await knex("poStock").where("poNo", poNo);
    if (getRemaingQuantity.length <= 0) {
      return res.json({
        error: false,
        message: "This is remaining Quantity",
        data: Quantity,
      });
    }

    return res.json({
      error: false,
      message: "This is remaining Quantity",
      data: JSON.parse(getRemaingQuantity[0].remaining),
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const {
      permissions: [statusChanger],
      id: statusChangerId,
      email,
    } = payload;
    const { value, error } = validation.exportToExcel(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: null,
      });
    }

    const {
      sort,
      order,
      status,
      type,
      filter: { startDate, endDate, dateField },
      dropdown = "all",
      asn_ids,
    } = value;
    let supplierDetails;
    if (dropdown === "supplier") {
      supplierDetails = await knex("supplier_details")
        .select("sap_code")
        .where("emailID", email)
        .first();

      if (!supplierDetails) {
        return res.status(404).json({
          error: true,
          message: "Supplier does not exist.",
        });
      }
    }

    const validDateFields = ["createdAt", "dispatchDate"];

    if (dateField && !validDateFields.includes(dateField)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid date field. Allowed values are 'createdAt' and 'dispatchDate'.",
        data: null,
      });
    }

    // let query = knex("asns");
    let query = knex("asns")
      .select(
        "asns.*",
        "departments.name as department",
        "supplier_details.supplier_name as supplier_name"
      )
      .from("asns")
      .leftJoin("departments", "asns.departmentId", "departments.id")
      .leftJoin(
        "supplier_details",
        "asns.supplierId",
        "supplier_details.sap_code"
      );
    if (dropdown === "supplier") {
      query.where("supplierId", supplierDetails.sap_code);
    } else {
      query.whereNot("status", "cancelled");
    }

    if (status !== "all") {
      query.where("asns.status", status);
    }

    const typeMapping = {
      ASN: "NB",
      SCR: "ZSER",
    };
    const mappedType = typeMapping[type];

    if (mappedType) {
      query.where("asns.type", mappedType);
    } else if (type !== "") {
      return res.status(400).json({
        error: true,
        message: "Invalid type value. Allowed values are 'ASN' and 'SCR'.",
        data: null,
      });
    }

    if (startDate && endDate && dateField) {
      const startDateISO = new Date(startDate).toISOString();
      let endDateISO = new Date(endDate).toISOString();
      endDateISO = endDateISO.slice(0, 10) + "T23:59:59.999Z";

      query.whereBetween(dateField, [startDateISO, endDateISO]);
    }

    if (asn_ids) {
      query.whereIn("asns.id", asn_ids);
    }
    let rows = await query.orderBy(sort, order);
    rows = rows.map((row) => {
      row.supplier = `${row.supplierId} - ${row.supplier_name}`;
      delete row.supplier_name;
      delete row.supplierId;
      delete row.departmentId;
      delete row.qrcode;
      row = {
        id: row.id,
        department: row.department,
        supplier: row.supplier,
        ...row,
      };
      return row;
    });
    console.log(rows.length);
    const filePath = await functions.generateUniqueFilePath("asn.xlsx");
    const excelContent = functions.generateExcelContent(rows);

    // Set headers for file download
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
    return res.status(500).json({
      error: true,
      message: "Unable to export",
      data: JSON.stringify(error.message),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "asns";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

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
  createAsn3,
  viewAsn2,
  updateAsn2,
  deleteAsn2,
  PaginateAsn2,
  QRCodeAsn,
  checkQRCode,
  asnStatusChange,
  asnPaymentStatusUpdate,
  viewAsnStatusHistory,
  viewAsnCurrentStatus,
  workFlowStatus,
  getQRCode,
  scannerHistory,
  //changeScrStatus,
  // viewAsn3,
  asnMaterialReceived,
  asnGateInward,
  asnGateInward2,
  updateVehicalStatus,
  cancelASN,
  unitConversion,
  getRemaingQuantity,
  PaginateAsn,
  exportToExcel,
  delteMultipleRecords,
};
