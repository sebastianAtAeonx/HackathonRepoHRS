import knex from "../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import fun from "../helpers/functions.js";
import moment from "moment-timezone";

async function gi(item) {
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
    return {
      error: true,
      message: "GI Already Exists",
    };
  } else {
    const poDetails = await fun.fetchPODetails(item.poNo);
    if (!poDetails.error) {
      const items = item.lineItems;
      const currentDateIST = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");
      let ITEM = [];
      const poNo = item.poNo;
      const UNIQUE_TRANSACTION_ID = uuidv4();
      items.forEach((item, index) => {
        if (item.Quantity > 0) {
          ITEM.push({
            DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
            DELIVERY_DATE: currentDateIST,
            QUANTITY: item.Quantity,
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
      const insertInASN = await knex("asns")
        .update({ giId: insertInDb })
        .where({ id: item.asn_id });

      const insertInASNMaterialReceived = await knex("asnMaterialReceived")
        .update({ giId: insertInDb })
        .where({ asn_id: item.asn_id });
      return {
        error: false,
        message: "GI Created",
      };
    }
    return {
      error: true,
      message: "PO Not Found",
    };
  }
}

async function grn(item) {
  
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
    console.log("here")
    return {
      error:true,
      message:"GRN is already done."
    }
    
  } else {
    const poDetails = await fun.fetchPODetails(item.poNo);
    if (!poDetails.error) {
      const items = item.lineItems
      let ITEM = [];
      const UNIQUE_TRANSACTION_ID = uuidv4();
      items.forEach((i) => {
        if (i.Quantity > 0) {
          ITEM.push({
            MATERIAL_NO: i.material,
            STORAGE_LOC: i.storageLocation,
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

      const currentDateIST = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");
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

      const updateInTable = await knex("asns")
        .update({ grnId: insertGrn })
        .where({ id: asn_id });

      const updateInScr = await knex("asnMaterialReceived")
        .update({ grnId: insertGrn })
        .where({ asn_id: asn_id });

      return {
       error:false,
       data:UNIQUE_TRANSACTION_ID,
       message:"GRN Entry Done"
      };
    }
    return{
      error:true,
      message:"PO Not Found"
    }
  }
}

async function ses(item) {
  const checkInDb = await knex("ses")
    .select(
      "sesUniqueId",
      "poNo",
      "header",
      "item",
      "sesCode",
      "sesStatus",
      "serviceActivity"
    )
    .where({ asnId: item.asn_id });
  if (checkInDb.length > 0) {
    if (
      checkInDb[0].sesCode == null &&
      checkInDb[0].sesStatus == null &&
      checkInDb[0].serviceActivity == null
    ) {
    return{
      error:true,
      message:"SES entry exists."
    }
    }
    return {
        error: true,
        message:"SES entry exists."
      }
    
  } else {
    const poDetails = await fun.fetchPODetails(item.poNo);
    if (!poDetails.error) {
      const items = item.lineItems
      if (!poDetails.PO_ITEMS) {
        return res.json({
          error: true,
          message: "PO not found",
        });
      }
      const data = [];
      let no = 0;
      for (const iterator of poDetails.PO_ITEMS) {
        const packageNo = iterator.PCKG_NO;
        const UNIQUE_TRANSACTION_ID = uuidv4();
        let ITEM = [];
        const currentDateIST = moment
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD");
        let temp = 1;
        let total = 0;
        const header = {
          SERVICE_ENTERY_SHEET: "",
          SHORT_TEXT: "service",
          PURCHASING_DOCUMENT: "",
          ITEM: poDetails.PO_ITEMS[no].PO_ITEM,
          DOCUMENT_DATE: item.dispatchDate,
          POSTING_DATE:currentDateIST,
          REFERENCE: item.poNo,
          DOCUMENT_HEADER_TEXT: poDetails.PO_HEADER_TEXTS,
          GROSS_VALUE: 0,
          INVOICE_NUMBER: "",
          INVOICE_DATE: "",
        };
        items.forEach((i, index) => {
          if (i.Quantity > 0) {
            const itemPackage = poDetails.PO_ITEM_SERVICES[index]
              ? poDetails.PO_ITEM_SERVICES[index].PCKG_NO
              : poDetails.PO_ITEM_SERVICES[0].PCKG_NO;
            if (itemPackage == packageNo + 1) {
              ITEM.push({
                ACTIVITY_NUMBER: poDetails.PO_ITEM_SERVICES
                  ? poDetails.PO_ITEM_SERVICES[index].SERVICE
                  : poDetails.PO_ITEM_SERVICES[0].SERVICE,
                LINE_NUMBER: poDetails.PO_ITEM_SERVICES
                  ? poDetails.PO_ITEM_SERVICES[index].EXT_LINE
                  : poDetails.PO_ITEM_SERVICES[0].EXT_LINE,
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
          }
        });
        header.GROSS_VALUE = total;
        if (ITEM.length > 0) {
          data.push({
            error: false,
            UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
            poNo: item.poNo,
            header,
            item: ITEM,
            TIME_STAMP: currentDateIST,
          });
          const insertSes = await knex("ses").insert({
            poNo: item.poNo,
            asnId: item.asn_id,
            sesUniqueId: UNIQUE_TRANSACTION_ID,
            header: JSON.stringify(header),
            item: JSON.stringify(ITEM),
            createdAt: currentDateIST,
          });

          const getSesId = await knex("asns")
            .select("sesId")
            .where("id", item.asn_id);
      
            const oldSesId =  getSesId[0].sesId != null ? JSON.parse(getSesId[0].sesId) :[]
          let sesId =[...oldSesId]

          sesId.push(insertSes[0]);

          const updateInTable = await knex("asns")
            .update({ sesId: JSON.stringify(sesId) })
            .where({ id: item.asn_id });
        }

        no++;
      }

      return{
        error:false,
        message:"SES entry done."
      }
      // let ITEM = [];
      // const currentDateIST = moment
      //   .tz("Asia/Kolkata")
      //   .format("YYYY-MM-DD HH:mm:ss");
      // const header = {
      //   SERVICE_ENTERY_SHEET: "",
      //   SHORT_TEXT: "service",
      //   PURCHASING_DOCUMENT: "",
      //   ITEM: "",
      //   DOCUMENT_DATE: item.dispatchDate,
      //   POSTING_DATE: item.dispatchDate,
      //   REFERENCE: item.poNo,
      //   DOCUMENT_HEADER_TEXT: poDetails.PO_HEADER_TEXTS,
      //   GROSS_VALUE: 0,
      //   INVOICE_NUMBER: "",
      //   INVOICE_DATE: "",
      // };
      // const UNIQUE_TRANSACTION_ID = uuidv4();
      // let temp = 1;
      // let total = 0;
      // items.forEach((i,index) => {
      //   if (i.Quantity > 0) {
      //     ITEM.push({
      //       ACTIVITY_NUMBER:poDetails.PO_ITEM_SERVICES?poDetails.PO_ITEM_SERVICES[index].SERVICE:poDetails.PO_ITEM_SERVICES[0].SERVICE,
      //       LINE_NUMBER: temp,
      //       SHORT_TEXT: i.serviceName,
      //       QUANTITY: i.Quantity,
      //       UOM: i.unit,
      //       NET_VALUE: i.price,
      //       GROSS_PRICE: i.price + i.gst,
      //       TAX_CODE: i.poItem,
      //       TAX_TARRIF_CODE: item.poNo,
      //     });
      //     temp++;
      //     total += i.subTotal;
      //   }
      // });
      // header.GROSS_VALUE = total;
      // const insertSes = await knex("ses").insert({
      //   poNo: item.poNo,
      //   asnId: item.id,
      //   sesUniqueId: UNIQUE_TRANSACTION_ID,
      //   header: JSON.stringify(header),
      //   item: JSON.stringify(ITEM),
      //   createdAt: currentDateIST,
      // });

      // const updateInTable = await knex("asns")
      //   .update({ sesId: insertSes })
      //   .where({ id: item.id });

      // return {
      //   UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
      //   poNo: item.poNo,
      //   header,
      //   item,
      //   TIME_STAMP: currentDateIST,
      // };
    }
    return{
        error: true,
        message:"PO Not Found."
      }
  }
}

export default {
  gi,
  grn,
  ses
};
