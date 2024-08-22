import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import moment from "moment-timezone";
import validation from "../../validation/workflow/ses.js";

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
          "sesUniqueId",
          "key",
          "poNo",
          "header",
          "item",
          "sesCode",
          "sesStatus",
          "serviceActivity"
        )
        .where({ asnId: item.id });
      if (checkInDb.length > 0) {
        if (
          checkInDb[0].sesCode == null &&
          checkInDb[0].sesStatus == null &&
          checkInDb[0].serviceActivity == null
        ) {
          const item = JSON.parse(checkInDb[0].item);
          const header = JSON.parse(checkInDb[0].header);
          // const UNIQUE_TRANSACTION_ID = uuidv4();
          const currentDateIST = moment
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss");
          return [
            {
              error: false,
              KEY: checkInDb[0].key ? checkInDb[0].key : "",
              UNIQUE_TRANSACTION_ID: checkInDb[0].sesUniqueId,
              poNo: checkInDb[0].poNo,
              header,
              item,
              TIME_STAMP: currentDateIST,
            },
          ];
        }
        return [
          {
            error: true,
          },
        ];
      } else {
        const poDetails = await fun.fetchPODetails(item.poNo);
        if (!poDetails.error) {
          const items = JSON.parse(item.lineItems);
          if (!poDetails.PO_ITEMS) {
            return res.status(404).json({
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
              PURCHASING_DOCUMENT: item.poNo,
              ITEM: poDetails.PO_ITEMS[no].PO_ITEM,
              DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
              POSTING_DATE: currentDateIST,
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
                    TAX_TARRIF_CODE: poDetails.PO_ITEM_SERVICES
                      ? poDetails.PO_ITEM_SERVICES[index].CTR_KEY_QM
                      : poDetails.PO_ITEM_SERVICES[0].CTR_KEY_QM,
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
                asnId: item.id,
                sesUniqueId: UNIQUE_TRANSACTION_ID,
                header: JSON.stringify(header),
                item: JSON.stringify(ITEM),
                createdAt: currentDateIST,
              });

              const getSesId = await knex("asns")
                .select("sesId")
                .where("id", item.id);

              const oldSesId =
                getSesId[0].sesId != null ? JSON.parse(getSesId[0].sesId) : [];
              let sesId = [...oldSesId];

              sesId.push(insertSes[0]);

              const updationDataIs = await functions.takeSnapShot(
                "asns",
                item.id
              );

              const updateInTable = await knex("asns")
                .update({ sesId: JSON.stringify(sesId) })
                .where({ id: item.id });
            }

            no++;
          }

          return data;
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
        console.log("here");
        return [
          {
            error: true,
          },
        ];
      }
      return null;
    }

    const result = [];
    for (const item of asnRow) {
      const data = await processRow(item);
      if (data) {
        data.forEach((i, index) => {
          if (data[index].error != true) {
            delete data[index].error;
            result.push(i);
          }
        });
        // result.push(...data);
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
      message: "Could not fetch data",
      data: error.message,
    });
  }
};

const getSESCode = async (req, res) => {
  try {
    // const { error, value } = validation.getSESCode(req.body);
    // if (error) {
    //   return res.json({
    //     error: true,
    //     message: error.details[0].message,
    //   });
    // }

    const { poNo, sesUniqueId, sesStatus, sesCode, srvItem } = req.body;
    const sesCodeData = await knex("ses")
      .where({ sesUniqueId: sesUniqueId })
      .andWhere({ poNo: poNo })
      .whereNull("sesCode")
      .whereNull("serviceActivity");
    if (sesCodeData.length <= 0) {
      return res.status(409).json({
        error: true,
        message: "SES Code already generated",
      });
    }

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    // const getIdIs = await knex("ses")
    //   .where({ sesUniqueId: sesUniqueId })
    //   .andWhere({ poNo: poNo })
    //   .select("id")
    //   .first();

    // const updationDataIs = await functions.takeSnapShot("ses", getIdIs.id);

    const insertSesCode = await knex("ses")
      .update({
        sesCode: sesCode,
        sesStatus: sesStatus,
        serviceActivity: JSON.stringify(srvItem),
        sesTime: currentDateIST,
      })
      .where({ sesUniqueId: sesUniqueId })
      .andWhere({ poNo: poNo });

    if (!insertSesCode) {
      return res.status(500).json({
        error: true,
        message: "SES Code not generated",
      });
    }

    return res.status(200).json({
      error: false,
      message: "SES Code Inserted Successfully.",
      data: insertSesCode,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not insert",
      data: error.message,
    });
  }
};

const paginateSES = async (req, res) => {
  try {
    const tableName = "ses";
    const searchFrom = ["sesCode", "poNo", "sesUniqueId", "sesStatus", "asnId"];
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, filter, sesCode, asnId } = value;

    let rows = knex(`${tableName}`);

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(`${element}`, `%${search}%`);
          });
        });
      }
    });

    if (sesCode !== undefined && sesCode !== "") {
      rows = rows.where("sesCode", sesCode);
    }
    if (asnId !== undefined && asnId !== "") {
      rows = rows.where("asnId", asnId);
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;

      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(`${endDate}T23:59:59.999Z`).toISOString();
        console.log(startDateISO, endDateISO);
        rows = rows.whereBetween(`ses.${dateField}`, [
          startDateISO,
          endDateISO,
        ]);
      }
    }
    const total = await rows.clone().count("ses.id as total").first();
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
      const Delete = ["header", "item"];
      for (const key of Delete) {
        delete row[key];
      }

      delete row.password;
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
      message: "Could not load list",
      data: error.message,
    });
  }
};
export default { SEStoSAP, getSESCode, paginateSES };
