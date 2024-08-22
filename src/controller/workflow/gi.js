import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import fun from "../../helpers/functions.js";
import moment from "moment-timezone";
import functions from "../../helpers/functions.js";
import jwt from "jsonwebtoken";
import constant from "../../helpers/constants.js";
import notification from "../notification.js";
import validation from "../../validation/workflow/gi.js";

const giToSap = async (req, res) => {
  try {
    const { error, value } = validation.giToSap(req.body);
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
      .where("MaterialGateInwardStatus", "Material Gate Inward")
      .whereRaw("DATE(MGITime) BETWEEN ? AND ?", [fromDate, toDate])
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
      const checkInDb = await knex("gis")
        .select(
          "giUniqueId as UNIQUE_TRANSACTION_ID",
          "poNo as PO_NUMBER",
          "vendor as VENDOR",
          "item as ITEM",
          "giCode",
          "giStatus"
        )
        .where("asnId", item.asn_id);
      if (checkInDb.length > 0) {
        if (checkInDb[0].giCode == null && checkInDb[0].giStatus == null) {
          checkInDb[0].ITEM = JSON.parse(checkInDb[0].ITEM);
          delete checkInDb[0].giCode;
          delete checkInDb[0].giStatus;
          return checkInDb[0];
        }
      } else {
        const poDetails = await fun.fetchPODetails(item.poNo);
        if (!poDetails.error) {
          const items = JSON.parse(item.lineItems);
          const currentDateIST = moment
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss");
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
          const poNo = item.poNo;
          const UNIQUE_TRANSACTION_ID = uuidv4();
          items.forEach((item, index) => {
            if (item.Quantity > 0) {
              ITEM.push({
                DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
                DELIVERY_DATE: currentDateIST,
                QUANTITY: item.Quantity,
                STORAGE_LOC: storageLocation ? storageLocation.code : "",
                SHORT_TEXT: poDetails.PO_ITEMS[index]
                  ? poDetails.PO_ITEMS[index].SHORT_TEXT
                  : item.itemName,
                PO_ITEM: item.poItem
                  ? item.poItem
                  : poDetails.PO_ITEMS[index]
                  ? poDetails.PO_ITEMS[index].PO_ITEM
                  : poDetails.PO_ITEMS[0].PO_ITEM,
                REFERENCE: poNo,
              });
            }
          });
          const insertInDb = await knex("gis").insert({
            giUniqueId: UNIQUE_TRANSACTION_ID,
            poNo: item.poNo,
            vendor: poDetails.PO_HEADER.VENDOR,
            item: JSON.stringify(ITEM),
            asnId: item.asn_id,
          });

          const updationDataIs = await functions.takeSnapShot(
            "asns",
            item.asn_id
          );

          const insertInASN = await knex("asns")
            .update({ giId: insertInDb })
            .where({ id: item.asn_id });

          const insertInASNMaterialReceived = await knex("asnMaterialReceived")
            .update({ giId: insertInDb })
            .where({ asn_id: item.asn_id });

          return {
            UNIQUE_TRANSACTION_ID,
            PO_NUMBER: item.poNo,
            VENDOR: poDetails.PO_HEADER.VENDOR,
            ITEM,
          };
        }
      }
    }

    const result = [];
    for (const item of asnRow) {
      const data = await processRow(item);
      if (data) {
        result.push(data);
      }
    }

    const giIds = await knex("invoices_textract")
      .select("sapGiId","sapInvoiceId")
      .whereNotNull("sapGiId");
   
for (const iterator of giIds) {
  const gi = await knex("gis").where(
    "id",
   iterator.sapGiId
  ).first()
  const getInvoiceData = await knex('invoicesToSap').where('id',iterator.sapInvoiceId)
  if(getInvoiceData[0].invoiceCode != null && getInvoiceData[0].invoiceCode != undefined && getInvoiceData[0].invoiceCode != [] && getInvoiceData[0].invoiceCode != '[]'){
    continue
  }
  if (gi.giCode == null && gi.giStatus == null) {
    result.push({
      UNIQUE_TRANSACTION_ID: gi.giUniqueId,
      PO_NUMBER: gi.poNo,
      VENDOR: gi.vendor,
      ITEM: JSON.parse(gi.Item),
    });
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

const getGiCode = async (req, res) => {
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

    const { giCode, giStatus, giUniqueId, poNo } = req.body;

    const giCodeData = await knex("gis")
      .where("giUniqueId", giUniqueId)
      .andWhere("poNo", poNo)
      .whereNull("giStatus")
      .whereNull("giCode");
    if (giCodeData.length <= 0) {
      return res.status(409).json({
        error: true,
        message: "GI Code already generated",
      });
    }
    const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

    const getId = await await knex("gis")
    .select("gis.id", "gis.asnId", "gis.vendor")
    .where("gis.giUniqueId", giUniqueId)
    .andWhere("gis.poNo", poNo)
    .first();

    const insertGiCode = await knex("gis")
      .update({
        giCode: giCode,
        giStatus: giStatus,
        giTime: currentDateIST,
      })
      .where({ giUniqueId: giUniqueId })
      .andWhere({ poNo: poNo });

    if (!insertGiCode) {
      return res.status(500).json({
        error: true,
        message: "GI Code not generated",
      });
    }

    const getSupplierId = await knex("users")
      .select("id")
      .where("email", "=", function () {
        this.select("emailId")
          .from("supplier_details")
          .where("sap_code", getId.vendor)
          .limit(1);
      })
      .first();
    const msg =
      getId.asnNo != null
        ? `Inbound code ${giCode} has been assigned for ASN No: ${getId.asnNo} of Purchase Order: ${poNo}.`
        : `Inbound code has been assigned for Purchase Order: ${poNo}.`;

    const createNotification = await notification.createNotification(
      [statusChangerId],
      "Inbound Code Assigned",
      msg,
      "0"
    );

    const supplierMsg =
      getId.asnNo != null
        ? `Inbound code ${giCode} has been generated for ASN No: ${getId.asnNo} of Purchase Order: ${poNo}.`
        : `Inbound code has been assigned for Purchase Order: ${poNo}.`;

    const createSupplierNotification = await notification.createNotification(
      [getSupplierId.id],
      "Inbound Code Generated",
      supplierMsg,
      "0"
    );

    return res.status(200).json({
      error: false,
      message: "GI Code generated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not generate",
      data: error.message,
    });
  }
};

const paginateGi = async (req, res) => {
  try {
    const tableName = "gis";
    const searchFrom = ["poNo", "giUniqueId", "giCode", "asnId"];

    const { error, value } = validation.paginate(req.body);
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
      giCodeExists,
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
      if (giCodeExists !== undefined) {
        if (giCodeExists) {
          this.whereNotNull("giCode");
        } else {
          this.whereNull("giCode");
        }
      }
      if (asnIdExists !== undefined) {
        if (asnIdExists) {
          this.whereNotNull("asnId");
        } else {
          this.whereNull("asnId");
        }
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
      if (giCodeExists !== undefined) {
        if (giCodeExists) {
          this.whereNotNull("giCode");
        } else {
          this.whereNull("giCode");
        }
      }
      if (asnIdExists !== undefined) {
        if (asnIdExists) {
          this.whereNotNull("asnId");
        } else {
          this.whereNull("asnId");
        }
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

    rows = rows.map((row) => {
      row.Item = JSON.parse(row.Item);
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
      message: "Could not retrive",
      data: JSON.stringify(error.message),
    });
  }
};

export default {
  giToSap,
  getGiCode,
  paginateGi,
};
