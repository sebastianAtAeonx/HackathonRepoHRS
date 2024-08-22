import sapPO from "../../services/poFromSap.js";
import knex from "../../config/mysql_db.js";
import validation from "../../validation/supplier/poDashboard.js";

let csrfToken = null;
let cookie = null;

const getCsrf = async (req, res) => {
  try {
    const result = await sapPO.createCSRF();
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

const poServiceCount = async (req, res) => {
  try {
    if (!csrfToken || !cookie) {
      await getCsrf();
    }

    const { error, value } = validation.count(req.body);
    const { supplier } = value;
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    // fetch PO No from SAP supplier code wise
    let data;
    data = await sapPO.fetchPoList(supplier, csrfToken, cookie);

    if (data.error) {
      data = await knex("purchase_orders_list")
        .where("supplierId", supplier)
        .select("poNumber as PO_NUMBER");
      // return res.json({
      //   error: true,
      //   message: "Failed to fetch PO List from SAP.",
      // });
    }
    const poNumbers = data.map((po) => po.PO_NUMBER);

    // Fetch details for each PO number
    // const poDataPromises = poNumbers.map((poNo) =>
    //   sapPO.fetchPoDetails(poNo, csrfToken, cookie)
    // );

    // const poDetails = await Promise.all(poDataPromises);

    const poDetails = [];
    const fulfilledPOs = [];
    const openPOs = [];

    // Batch size for fetching PO details
    const batchSize = 10;

    // Function to fetch PO details from SAP or database
    const fetchPoDetails = async (poNo) => {
      try {
        return await sapPO.fetchPoDetails(poNo, csrfToken, cookie);
      } catch (error) {
        console.error(
          `Error fetching PO details for PO Number ${poNo}:`,
          error
        );
        const checkInDb = await knex("purchase_orders").where("poNo", poNo);
        if (checkInDb.length > 0) {
          const items = JSON.parse(checkInDb[0].poItems);
          return { items };
        } else {
          return { items: [] }; // Return an empty array if no data found
        }
      }
    };

    // Batch the PO numbers and fetch details in parallel
    for (const batchPoNumbers of poNumbers.map((_, i) =>
      poNumbers.slice(i * batchSize, (i + 1) * batchSize)
    )) {
      const batchPromises = batchPoNumbers.map(fetchPoDetails);
      const batchResults = await Promise.all(batchPromises);
      poDetails.push(...batchResults);
    }

    // Separate PO details into service and material
    const service = poDetails.filter(
      (po) => po.PO_HEADER && po.PO_HEADER.DOC_TYPE === "ZSER"
    );
    const material = poDetails.filter(
      (po) => po.PO_HEADER && po.PO_HEADER.DOC_TYPE !== "ZSER"
    );

    // Check fulfillment status and categorize POs
    for (const data of poDetails) {
      if (data.PO_NUMBER) {
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
              data.PO_ITEM_SERVICES[index].ORIGINAL_QUANTITY =
                data.PO_ITEM_SERVICES[index].QUANTITY;
              data.PO_ITEM_SERVICES[index].QUANTITY =
                getPoStock[0].remaining[index];
            });
          } else {
            data.PO_ITEMS.forEach((element, index) => {
              data.PO_ITEMS[index].ORIGINAL_QUANTITY =
                data.PO_ITEMS[index].QUANTITY;
              data.PO_ITEMS[index].QUANTITY = getPoStock[0].remaining[index];
            });
          }
        }
      }
      // Check if the PO has items and if all item quantities are 0
      // Push the PO to the appropriate array based on fulfillment status
      if (data.PO_HEADER && data.PO_HEADER.DOC_TYPE === "ZSER") {
        const isFulfilled = data.PO_ITEM_SERVICES
          ? data.PO_ITEM_SERVICES.every((item) => item.QUANTITY === 0)
          : false;
        if (isFulfilled) {
          fulfilledPOs.push(data);
        } else {
          openPOs.push(data);
        }
      } else {
        const isFulfilled = data.PO_ITEMS
          ? data.PO_ITEMS.every((item) => item.QUANTITY === 0)
          : false;
        if (isFulfilled) {
          fulfilledPOs.push(data);
        } else {
          openPOs.push(data);
        }
      }
    }

    return res.status(200).json({
      error: false,
      message: "Data is successfully fetched from SAP",
      data: {
        supplier: supplier,
        totalPo: poDetails.length,
        services: service.length,
        material: material.length,
        fulfilledPOs: fulfilledPOs.length,
        openPOs: openPOs.length,
        // poDetails : poDetails,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not count record.",
      data: error.message,
    });
  }
};

export default {
  poServiceCount,
};
