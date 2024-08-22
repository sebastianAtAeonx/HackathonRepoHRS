import sapPO from "../../services/poFromSap.js";
import Joi from "joi";
import fs from "../../helpers/functions.js";
import knex from "../../config/mysql_db.js";
import constants from "../../helpers/constants.js";
import validation from "../../validation/supplier/purchaseOrders.js";

let csrfToken = null;
let cookie = null;

const getCsrf = async (req, res) => {
  try {
    const result = await sapPO.createCSRF();
    console.log(result);
    csrfToken = result.token;
    cookie = result.cookie;
  } catch (err) {
    console.log(err);
    // throw err;
    //  return res.json({
    //   error:true,
    //   message:"Failed to get CSRF Token"
    //  })
  }
};
setInterval(getCsrf, 30 * 60 * 1000); //token will be refreshed every 30 mins

const fetchPoDetails = async (req, res) => {
  if (!csrfToken || !cookie) {
    await getCsrf();
  }

  const { error, value } = validation.fetchPoDetails(req.body);
  const { PoNumber } = value;
  if (error) {
    return res.json({
      error: true,
      message: error.details[0].message,
      data: error,
    });
  }
  const sap_server = await constants.getEnv("SAP_SERVER");
  console.log(sap_server);
  let data;
  if (sap_server === "true") {
    data = await sapPO.fetchPoDetails(PoNumber, csrfToken, cookie);
  }
  if (sap_server === "false" || (data && data.error)) {
    const checkInDb = await knex("purchase_orders").where("poNo", PoNumber);
    if (checkInDb.length > 0) {
      const data = JSON.parse(checkInDb[0].poItems);
      const getPoStock = await knex("poStock").where("poNo", data.PO_NUMBER);
      if (getPoStock.length <= 0) {
        if (data.PO_HEADER.DOC_TYPE != "ZSER") {
          data.PO_ITEMS.forEach((element, index) => {
            data.PO_ITEMS[index].ORIGINAL_QUANTITY =
              data.PO_ITEMS[index].QUANTITY;
          });
        } else {
          data.PO_ITEMS.forEach((element, index) => {
            data.PO_ITEM_SERVICES[index].ORIGINAL_QUANTITY =
              data.PO_ITEM_SERVICES[index].QUANTITY;
          });
        }
      } else {
        getPoStock[0].remaining = JSON.parse(getPoStock[0].remaining);
        if (data.PO_HEADER.DOC_TYPE === "ZSER") {
          data.PO_ITEMS.forEach((element, index) => {
            // data.PO_ITEM_SERVICES[index].ORIGINAL_QUANTITY =
            //   data.PO_ITEM_SERVICES[index].QUANTITY;
            data.PO_ITEM_SERVICES[index].QUANTITY =
              getPoStock[0].remaining[index];
          });
        } else {
          data.PO_ITEMS.forEach((element, index) => {
            // data.PO_ITEMS[index].ORIGINAL_QUANTITY = data.PO_ITEMS[index].QUANTITY;
            data.PO_ITEMS[index].QUANTITY = getPoStock[0].remaining[index];
          });
        }
      }
      const allZero = data.PO_ITEMS.length > 0 && data.PO_ITEMS.every(item => item.QUANTITY === 0);
      const isOpen = allZero ? '0' : '1';

      if (isOpen === '0') {
        await knex("purchase_orders_list")
          .update({ isOpen: isOpen })
          .where({ poNumber: PoNumber });
      }

      return res.status(200).json({
        error: false,
        message: "Data is successfully fetched from SAP",
        data: {
          poNo: PoNumber,
          data: data,
        },
      });
    }
    return res.status(500).json({
      error: true,
      message: "Failed to fetch PO from SAP.",
      // data: data,
    });
  }

  const getPoStock = await knex("poStock").where("poNo", data.PO_NUMBER);
  if (getPoStock.length <= 0) {
    if (data.PO_HEADER.DOC_TYPE != "ZSER") {
      data.PO_ITEMS.forEach((element, index) => {
        data.PO_ITEMS[index].ORIGINAL_QUANTITY = data.PO_ITEMS[index].QUANTITY;
      });
    } else {
      data.PO_ITEMS.forEach((element, index) => {
        data.PO_ITEM_SERVICES[index].ORIGINAL_QUANTITY =
          data.PO_ITEM_SERVICES[index].QUANTITY;
      });
    }
  } else {
    getPoStock[0].remaining = JSON.parse(getPoStock[0].remaining);
    if (data.PO_HEADER.DOC_TYPE === "ZSER") {
      data.PO_ITEMS.forEach((element, index) => {
        data.PO_ITEM_SERVICES[index].ORIGINAL_QUANTITY =
          data.PO_ITEM_SERVICES[index].QUANTITY;
        data.PO_ITEM_SERVICES[index].QUANTITY = getPoStock[0].remaining[index];
      });
    } else {
      data.PO_ITEMS.forEach((element, index) => {
        data.PO_ITEMS[index].ORIGINAL_QUANTITY = data.PO_ITEMS[index].QUANTITY;
        data.PO_ITEMS[index].QUANTITY = getPoStock[0].remaining[index];
      });
    }
  }

  const allZero = data.PO_ITEMS.length > 0 && data.PO_ITEMS.every(item => item.QUANTITY === 0);
  const isOpen = allZero ? '0' : '1';
  
  if (isOpen === '0') {
    await knex("purchase_orders_list")
      .update({ isOpen: isOpen })
      .where({ poNumber: PoNumber });
  }
  
  
  const select = await knex("purchase_orders").where("poNo", PoNumber).first();
  if (!select) {
    const insertPoInDb = await knex("purchase_orders").insert({
      poNo: PoNumber,
      poItems: JSON.stringify(data),
    });
  }
  return res.status(200).json({
    error: false,
    message: "Data is successfully fetched from SAP",
    data: {
      poNo: PoNumber,
      data: data,
    },
  });
};

// const fetchPoList = async (req, res) => {
//   if (!csrfToken || !cookie) {
//     await getCsrf();
//   }

//   const schema = Joi.object({
//     SUPPLIER: Joi.string().required(),
//     type: Joi.string().valid("service", "material", "").default(""),
//     search: Joi.string().allow("").default(""),
//     offset: Joi.number().integer().default(0),
//     limit: Joi.number().integer().default(100),
//     order: Joi.string().valid("asc", "desc").default("desc"),
//     sort: Joi.string().default("PO_NUMBER"),
//   });
//   const { error, value } = schema.validate(req.body);
//   const { SUPPLIER, type, search, offset, limit, order, sort } = value;

//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//       // data: error,
//     });
//   }
//   let data = await sapPO.fetchPoList(SUPPLIER, csrfToken, cookie);
//   if (data.error) {
//     return res.json({
//       error: true,
//       message: "Failed to fetch PO List from SAP.",
//       // data: data,
//     });
//   }

//   if (type !== undefined && type !== "") {
//     const typePrefix = type === "service" ? "46" : "41";
//     data = data.filter((po) => po.PO_NUMBER.startsWith(typePrefix));
//   }

//   if (search !== undefined && search !== "") {
//     data = data.filter((po) => po.PO_NUMBER.includes(search));
//   }
//   const totalCount = data.length;

//   data = data.slice(offset, offset + limit);
//   data.sort((a, b) =>
//     order === "asc" ? a[sort] - b[sort] : b[sort] - a[sort]
//   );
//   data.forEach((po, index) => {
//     // Calculate serial number based on pagination
//     const sr =
//       order === "asc" ? data.length - offset - index : offset + index + 1;
//     po.sr = sr;
//   });

//   for (const iterator of data) {
//     const checkInDb = await knex("purchase_orders_list").where(
//       "poNumber",
//       iterator.PO_NUMBER
//     );
//     if (checkInDb.length <= 0) {
//       const data = {
//         supplierId: SUPPLIER,
//         poNumber: iterator.PO_NUMBER,
//       };
//       await knex("purchase_orders_list").insert(data);
//     }
//   }
//   return res.json({
//     error: false,
//     message: "Data is successfully fetched from SAP",
//     data: {
//       SUPPLIER: SUPPLIER,
//       total: totalCount,
//       data: data,
//     },
//   });
// };

const fetchPoList = async (req, res) => {
  try {
    if (!csrfToken || !cookie) {
      await getCsrf();
    }

    const { error, value } = validation.fetchPoList(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { SUPPLIER, type, search, offset, limit, order, sort } = value;

    let data;
    const sap_server = await constants.getEnv("SAP_SERVER");
    console.log(sap_server);
    if (sap_server === "true") {
      data = await sapPO.fetchPoList(SUPPLIER, csrfToken, cookie);
    }
    if (sap_server === "false" || (data && data.error)) {
      data = await knex("purchase_orders_list")
        .where("supplierId", SUPPLIER)
        .select("poNumber as PO_NUMBER");
      // return res.json({
      //   error: true,
      //   message: "Failed to fetch PO List from SAP.",
      //   // data: data,
      // });
    }

    if (type === "service" || type === "material") {
      const typePrefix = type === "service" ? "46" : "41";
      data = data.filter((po) => po.PO_NUMBER.startsWith(typePrefix));
    }

    if (search) {
      data = data.filter((po) => po.PO_NUMBER.includes(search));
    }

    const totalCount = data.length;

    data = data.slice(offset, offset + limit);
    data.sort((a, b) => {
      const sortA = a[sort];
      const sortB = b[sort];
      return order === "asc" ? sortA - sortB : sortB - sortA;
    });

    // Calculate serial number based on pagination
    data.forEach((po, index) => {
      const sr =
        order === "desc" ? offset + index + 1 : totalCount - offset - index;
      po.sr = sr;
    });

    // Batch insert data into the database
    const poNumbers = data.map((po) => po.PO_NUMBER);
    const existingPOs = await knex("purchase_orders_list")
      .whereIn("poNumber", poNumbers)
      .select("poNumber");

    const poNumbersToAdd = poNumbers.filter(
      (poNumber) =>
        !existingPOs.some((existingPO) => existingPO.poNumber === poNumber)
    );

    const insertData = poNumbersToAdd.map((poNumber) => ({
      supplierId: SUPPLIER,
      poNumber: poNumber,
    }));

    if (insertData.length > 0) {
      await knex("purchase_orders_list").insert(insertData);
    }

    return res.status(200).json({
      error: false,
      message: "Data is successfully fetched from SAP",
      data: {
        SUPPLIER: SUPPLIER,
        total: totalCount,
        data: data,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Unable to fetch PO",
    });
  }
};

export default {
  getCsrf,
  fetchPoDetails,
  fetchPoList,
  //fetchSupplierDetail
};
