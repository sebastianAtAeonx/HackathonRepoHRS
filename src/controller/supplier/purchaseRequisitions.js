import Joi from "joi";
import knex from "../../config/mysql_db.js";
import moment from "moment";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/purchaseRequisition.js";
import constants from "../../helpers/constants.js";
import s3 from "../../s3/s3.js";
import sapPr from "../../services/prFromSap.js";

let csrfToken = null;
let cookie = null;
//  code not in use
const getCsrf = async (req, res) => {
  try {
    const result = await sapPr.createCSRF();
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

const viewPurchaseRequisitions = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const schema = Joi.object({
      id: Joi.number().required(),
    });

    const { error, value } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;
    const result = await knex(tableName)
      .where({
        id,
      })
      .select();
    if (result.length == 0) {
      return res.status(500).json({
        error: true,
        message: "Unable to view purchase requisition",
        data: error,
      });
    }
    let items = [];
    let services = [];
    if (result[0].pr_type === "item") {
      const get_result = await knex("purchase_requisition_items").where(
        "pr_id",
        result[0].id
      );

      if (get_result.length > 0) {
        for (const iterator of get_result) {
          items.push(iterator);
        }
      }
      result[0].items = items;
    } else if (result[0].pr_type === "service") {
      const get_result = await knex("pr_services").where("pr_id", result[0].id);

      if (get_result.length > 0) {
        for (const iterator of get_result) {
          services.push(iterator);
        }
      }
      result[0].services = services;
    }

    return res.status(200).json({
      error: false,
      message: "View successfull",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const deletePurchaseRequisitions = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";

    const schema = Joi.object({
      id: Joi.number().required(),
    });

    const { error, value } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const result = await knex(tableName)
      .where({
        id,
      })
      .delete();

    if (result) {
      return res.status(200).json({
        error: false,
        message: "Record deleted successfully",
      });
    } else {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const PaginatePurchaseRequisitions = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const searchFrom = ["shipping_method"];

    const schema = Joi.object({
      offset: Joi.number().default(0),
      limit: Joi.number().default(50),
      sort: Joi.string().default("id"),
      order: Joi.string().valid("asc", "desc").default("desc"),
      status: Joi.string().allow("", null).default(""),
      search: Joi.string().allow("", null).default(null),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let results = knex("purchase_requisitions")
      .join("departments", "departments.id", "purchase_request.department_id")
      .select("purchase_request.*", "departments.name");

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
    const total = await results
      .count("purchase_requisitions.id as total")
      .first();
    let rows = knex("purchase_requisitions")
      .join("departments", "departments.id", "purchase_request.department_id")
      .select("purchase_request.*", "departments.name");

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
      message: "Retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const PrStatus = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.number().required(),
      status: Joi.string()
        .valid(
          "draft",
          "submitted",
          "approved",
          "rejected",
          "processing",
          "closed"
        )
        .required(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, status } = value;

    const current_status_in_table = await knex("purchase_requisitions")
      .where({ id: id, isDeleted: "0" })
      .select("status");

    if (current_status_in_table.length == 0) {
      return res.status(400).json({
        error: true,
        message: "Provieded ID is invalid",
        data: [],
      });
    }

    if (current_status_in_table[0].status === "draft") {
      if (status === "submitted") {
        const updationDataIs = await functions.takeSnapShot(
          "purchase_requisitions",
          id
        );
        const update_db = await knex("purchase_requisitions")
          .where("id", id)
          .update({
            status: status,
          });

        if (!update_db) {
          return res.status(500).json({
            error: true,
            message: "Unable to update the status",
          });
        }

        if (id) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "purchase_requisitions",
            "id",
            id
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
        return res.status(200).json({
          error: false,
          message: "The status updated to 'submitted' successfully",
        });
      } else {
        return res.status(409).json({
          error: true,
          message: "You can change the status from 'draft' to 'submitted' only",
        });
      }
    } else if (current_status_in_table[0].status === "submitted") {
      if (status === "rejected" || status === "approved") {
        const updationDataIs = await functions.takeSnapShot(
          "purchase_requisitions",
          id
        );
        const update_db = await knex("purchase_requisitions")
          .where("id", id)
          .update({
            status: status,
          });

        if (!update_db) {
          return res.status(500).json({
            error: true,
            message: "Unable to update the status",
          });
        }

        if (id) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "purchase_requisitions",
            "id",
            id
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
        return res.status(200).json({
          error: false,
          message: `The status updated to ${status} successfully`,
        });
      } else {
        return res.status(409).json({
          error: true,
          message:
            "You can change the status from 'submitted' to 'approved'/'rejected' only",
        });
      }
    } else if (current_status_in_table[0].status === "approved") {
      if (status === "processing") {
        const updationDataIs = await functions.takeSnapShot(
          "purchase_requisitions",
          id
        );
        const update_db = await knex("purchase_requisitions")
          .where("id", id)
          .update({
            status: status,
          });

        if (!update_db) {
          return res.status(500).json({
            error: true,
            message: "Unable to update the status",
          });
        }

        if (id) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "purchase_requisitions",
            "id",
            id
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
        return res.status(200).json({
          error: false,
          message: `The status updated to ${status} successfully`,
        });
      } else {
        return res.status(409).json({
          error: true,
          message:
            "You can change the status from 'approved' to 'processing' only",
        });
      }
    } else if (current_status_in_table[0].status === "processing") {
      if (status === "closed") {
        const updationDataIs = await functions.takeSnapShot(
          "purchase_requisitions",
          id
        );
        const update_db = await knex("purchase_requisitions")
          .where("id", id)
          .update({
            status: status,
          });

        if (!update_db) {
          return res.status(500).json({
            error: true,
            message: "Unable to update the status",
          });
        }

        if (id) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "purchase_requisitions",
            "id",
            id
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
        return res.status(200).json({
          error: false,
          message: `The status updated to ${status} successfully`,
        });
      } else {
        return res.status(409).json({
          error: true,
          message:
            "You can change the status from 'processing' to 'closed' only",
        });
      }
    } else if (current_status_in_table[0].status === "rejected") {
      if (status === "approved") {
        const updationDataIs = await functions.takeSnapShot(
          "purchase_requisitions",
          id
        );
        const update_db = await knex("purchase_requisitions")
          .where("id", id)
          .update({
            status: status,
          });

        if (!update_db) {
          return res.status(500).json({
            error: true,
            message: "Unable to update the status",
          });
        }
        if (id) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "purchase_requisitions",
            "id",
            id
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
        return res.status(200).json({
          error: false,
          message: `The status updated to ${status} successfully`,
        });
      } else {
        return res.status(409).json({
          error: true,
          message:
            "You can change the status from 'rejected' to 'approved' only",
        });
      }
    } else {
      return res.status(500).json({
        error: true,
        message: "You can not change the status now",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const PaginatePRandPRItems = async (req, res) => {
  try {
    const searchFrom = ["pr_type"];

    const schema = Joi.object({
      offset: Joi.number().default(0),
      limit: Joi.number().default(50),
      sort: Joi.string().default("id"),
      order: Joi.string().valid("asc", "desc").default("desc"),
      status: Joi.string()
        .allow("draft", "submitted", "approved", "rejected", null, "")
        .default("draft"),
      search: Joi.string().allow("", null).default(null),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error.details,
      });
    }

    let { offset, limit, order, sort, search, status } = value;

    let query = knex("purchase_requisitions");

    if (search != "") {
      for (const iterator of searchFrom) {
        query = query.orWhereILike(iterator, `%${search}%`);
      }
    }

    if (status != "") {
      query = query.where("status", status);
    }

    let totalQuery = query;

    const total = await totalQuery;

    query = query.offset(offset).limit(limit).orderBy(sort, order);

    const purchase_requisitions = await query;

    for (const purchaseRequisition of purchase_requisitions) {
      if (purchaseRequisition.plant_id) {
        const getPlantName = await knex("plants").where(
          "id",
          purchaseRequisition.plant_id
        );
        if (getPlantName.length > 0) {
          const { name } = getPlantName[0];
          purchaseRequisition.plant_name = name;
        }
      }

      let items;

      if (purchaseRequisition.pr_type == "service") {
        items = await knex("pr_services").where(
          "pr_id",
          purchaseRequisition.id
        );

        for (const iterator of items) {
          const get_name_of_service = await knex("services").where(
            "id",
            iterator.service_id
          );

          if (get_name_of_service.length > 0) {
            iterator.service_name = get_name_of_service[0].name;
          }
        }
        purchaseRequisition.items = [];
        purchaseRequisition.pr_services = items;
      } else {
        items = await knex("purchase_requisition_items").where(
          "pr_id",
          purchaseRequisition.id
        );

        for (const iterator of items) {
          const get_name_of_item = await knex("items").where(
            "id",
            iterator.item_id
          );

          if (get_name_of_item.length > 0) {
            iterator.item_name = get_name_of_item[0].name;
          }
        }
        purchaseRequisition.pr_items = items;
        purchaseRequisition.service = [];
      }

      // purchaseRequisition.purchase_requisition_items_or_services = items;
    }

    if (purchase_requisitions.length == 0) {
      return res.json({
        error: true,
        message: "No purchase requisitions found.",
        data: purchase_requisitions,
        total: total.length,
      });
    }

    return res.status(200).json({
      error: false,
      message: "retrieved successfully.",
      data: purchase_requisitions,
      total: total.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const createPurchaseRequisitions = async (req, res) => {
  try {
    const serviceSchema = Joi.object({
      service_id: Joi.number().required(),
      unit_id: Joi.string().required(),
      status: Joi.string()
        .valid("draft", "submitted", "approved", "rejected")
        .default("draft"),
    });

    const itemSchema = Joi.object({
      item_id: Joi.number().required(),
      qty: Joi.number().integer().positive().required(),
      unit_id: Joi.string().required(),
      status: Joi.string()
        .valid("pending", "processing", "cancelled", "onhold")
        .default("pending"),
    });

    const schema = Joi.object({
      subscriber_id: Joi.string().required().trim(),
      plant_id: Joi.string().required().trim(),
      requisition_number: Joi.string().required().trim(),
      requisition_date: Joi.string().required().trim(),
      deadline: Joi.string().required().trim(),
      status: Joi.string()
        .valid("draft", "submitted", "approved", "rejected")
        .default(""),
      pr_type: Joi.string().valid("item", "service").required(),
      pr_services: Joi.when("pr_type", {
        is: "service",
        then: Joi.array().items(serviceSchema).required(),
        otherwise: Joi.forbidden(),
      }),
      pr_items: Joi.when("pr_type", {
        is: "item",
        then: Joi.array().items(itemSchema).required(),
        otherwise: Joi.forbidden(),
      }),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    let {
      subscriber_id,
      plant_id,
      requisition_number,
      requisition_date,
      deadline,
      status,
      pr_type,
    } = value;

    const dateString = requisition_date;
    const parts = dateString.split("-");
    const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
    const r_date = dateObject;

    const dateString2 = deadline;
    const parts2 = dateString2.split("-");
    const dateObject2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);
    const d_line = dateObject2;

    const insert_pr = await knex("purchase_requisitions").insert({
      subscriber_id,
      plant_id,
      requisition_number,
      requisition_date: r_date,
      deadline: d_line,
      status,
      pr_type,
    });

    if (!insert_pr) {
      return res.json({
        error: true,
        message: "Data submission failed - 1",
      });
    }

    if (value.pr_type === "service") {
      for (const iterator of value.pr_services) {
        iterator.pr_id = insert_pr[0];
        const insert_pr_services = await knex("pr_services").insert(iterator);
        if (!insert_pr_services) {
          return res.json({
            error: true,
            message: "Data submission failed - 2",
          });
        }
      }
    } else {
      for (const iterator of value.pr_items) {
        iterator.pr_id = insert_pr[0];
        const insert_pr_items = await knex("purchase_requisition_items").insert(
          iterator
        );

        if (!insert_pr_items) {
          return res.json({
            error: true,
            message: "Data submission failed - 3",
          });
        }
      }
    }

    return res.json({
      error: false,
      message: "Data submitted successfully",
      inserted_id: insert_pr[0],
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updatePurchaseRequisitions = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const serviceSchema = Joi.object({
      id: Joi.number().required(),
      service_id: Joi.number().required(),
      unit_id: Joi.string().required(),
      status: Joi.string()
        .valid("draft", "submitted", "approved", "rejected")
        .default("draft"),
    });

    const itemSchema = Joi.object({
      id: Joi.number().required(),
      item_id: Joi.number().required(),
      qty: Joi.number().integer().positive().required(),
      unit_id: Joi.number().required(),
      status: Joi.string()
        .valid("pending", "processing", "cancelled", "onhold")
        .default("pending"),
    });

    const schema = Joi.object({
      id: Joi.number().required(),
      subscriber_id: Joi.string().required().trim(),
      plant_id: Joi.string().required().trim(),
      requisition_number: Joi.string().required().trim(),
      requisition_date: Joi.string().required().trim(),
      deadline: Joi.string().required().trim(),
      status: Joi.string()
        .valid("draft", "submitted", "approved", "rejected")
        .default(""),
      pr_type: Joi.string().valid("item", "service").required(),
      pr_services: Joi.when("pr_type", {
        is: "service",
        then: Joi.array().items(serviceSchema).required(),
        otherwise: Joi.forbidden(),
      }),
      pr_items: Joi.when("pr_type", {
        is: "item",
        then: Joi.array().items(itemSchema).required(),
        otherwise: Joi.forbidden(),
      }),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    let {
      id,
      subscriber_id,
      plant_id,
      requisition_number,
      requisition_date,
      deadline,
      status,
      pr_type,
    } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const dateString = requisition_date;
    const parts = dateString.split("-");
    const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
    const r_date = dateObject;

    const dateString2 = deadline;
    const parts2 = dateString2.split("-");
    const dateObject2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);
    const d_line = dateObject2;

    const updationDataIs = await functions.takeSnapShot(
      "purchase_requisitions",
      id
    );
    const update_pr = await knex("purchase_requisitions")
      .where("id", id)
      .update({
        subscriber_id,
        plant_id,
        requisition_number,
        requisition_date: r_date,
        deadline: d_line,
        status,
        pr_type,
      });

    if (!update_pr) {
      return res.json({
        error: true,
        message: "Updation is failed",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "purchase_requisitions",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    if (value.pr_type === "service") {
      for (const service of value.pr_services) {
        const updationDataIs = await functions.takeSnapShot(
          "pr_services",
          service.id
        );
        const insert_pr_services = await knex("pr_services")
          .where("id", service.id)
          .update(service);
        if (insert_pr_services.length == 0) {
          return res.json({
            error: true,
            message: "Updation Failed - 2",
          });
        }
        if (service) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "pr_services",
            "id",
            service.id
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
      }
    } else {
      for (const item of value.pr_items) {
        const updationDataIs = await functions.takeSnapShot(
          "purchase_requisition_items",
          item.id
        );
        const insert_pr_items = await knex("purchase_requisition_items")
          .where("id", item.id)
          .update(item);

        if (insert_pr_items.length == 0) {
          return res.json({
            error: true,
            message: "Updation failed - 3",
          });
        }
        if (item) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "purchase_requisition_items",
            "id",
            item.id
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
      }
    }

    return res.json({
      error: false,
      message: "Record updated successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

// Current code
const createPr = async (req, res) => {
  try {
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }
    const token = await functions.decodeAccessToken(accessToken);
    const requisitioner = token.decodedToken.id;

    const reqBody = req.body;

    const transformedBody = {
      document_type: reqBody.document_type,
      header_text: reqBody.header_text,
      pr_type: reqBody.pr_type,
      delivery_date: reqBody.delivery_date,
      plant_id: reqBody.plant_id,
      stor_loc_id: reqBody.stor_loc_id,
      purchase_grp_id: reqBody.purchase_grp_id,
      purchase_org_id: reqBody.purchase_org_id,
      // attachment: reqBody.attachment,
      total: reqBody.total,
      pr_data: [],
    };

    Object.keys(reqBody).forEach((key) => {
      const match = key.match(/^pr_data\[(\d+)\]\./);

      if (match) {
        const index = parseInt(match[1], 10);
        const field = key.replace(`pr_data[${index}].`, "");

        // Ensure the pr_data array has an object at the current index
        if (!transformedBody.pr_data[index]) {
          transformedBody.pr_data[index] = {};
        }

        // Assign the value to the corresponding field
        transformedBody.pr_data[index][field] = reqBody[key];
      }
    });

    const { error, value } = validation.createPR(transformedBody);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }

    let attachmentFileName;
    let uploadParams = {};
    let path;

    //date in IST
    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    let {
      document_type,
      header_text,
      pr_type,
      delivery_date,
      plant_id,
      stor_loc_id,
      total,
      purchase_grp_id,
      purchase_org_id,
      attachment,
      pr_data,
    } = value;
    value.requisitioner = requisitioner;

    const lastPrRecord = await knex("purchase_requisitions")
      .select("pr_no")
      .orderBy("id", "desc")
      .limit(1)
      .first();

    let prCounter = 1;
    if (lastPrRecord) {
      const lastPrNumber = lastPrRecord.pr_no;
      const numericPart = parseInt(lastPrNumber.slice(2)); // Extract numeric part after "PR"
      prCounter = numericPart + 1;
    }
    let prno = `PR${String(prCounter).padStart(6, "0")}`;

    // Checking for foreign Keys

    if (plant_id) await functions.checkForeignId("plants", plant_id);
    if (stor_loc_id)
      await functions.checkForeignId("storage_locations", stor_loc_id);
    if (purchase_grp_id)
      await functions.checkForeignId("purchase_groups", purchase_grp_id);
    if (purchase_org_id) {
      const check = await knex("purchase_organization")
        .select("purchase_group_id")
        .where("id", purchase_org_id)
        .first();
      console.log(check);
      if (check) {
        if (purchase_grp_id !== check.purchase_group_id) {
          return res.status(400).json({
            error: true,
            message:
              "Please select purchase organization of given purchase group.",
          });
        }
      }
      await functions.checkForeignId("purchase_organization", purchase_org_id);
    }

    for (const item of pr_data) {
      try {
        if (item.material_id)
          await functions.checkForeignId("materials", item.material_id);
        if (item.matl_group_id)
          await functions.checkForeignId("material_group", item.matl_group_id);
        if (item.uom_id) await functions.checkForeignId("units", item.uom_id);
      } catch (error) {
        return res.status(422).json({ error: true, message: error.message });
      }

      if (item.service_id) {
        const service = await knex("services")
          .where("id", item.service_id)
          .first();

        if (!service) {
          return res.status(404).json({
            error: true,
            message: "Service Not Found",
            data: [],
          });
        }
        if (service.name !== item.short_text) {
          return res.status(400).json({
            error: true,
            message: "Service and Short Text should be same.",
          });
        }
      }
      if (item.material_id) {
        const materialData = await knex("materials")
          .where("id", item.material_id)
          .first();
        if (materialData.name !== item.short_text) {
          return res.status(400).json({
            error: true,
            message: "Material and Short Text should be same.",
          });
        }
      }
    }

    if (req.files && req.files.attachment) {
      const attachment = req.files.attachment;
      const allowedFileTypes = ["jpg", "png", "pdf", "jpeg"];
      const fileExtension = attachment.name.split(".").pop().toLowerCase();

      if (!allowedFileTypes.includes(fileExtension)) {
        return res.status(400).json({
          error: true,
          message: "Only jpg, png, pdf, and jpeg file formats are allowed",
        });
      }
      attachmentFileName = new Date().getTime() + "-" + attachment.name;

      // Upload attachment to S3
      uploadParams = {
        Bucket: constants.s3Creds.bucket,
        Key: "content-server/purchase_requisition/" + attachmentFileName,
        Body: attachment.data,
      };

      path = constants.admindetails.homePageUrl + uploadParams.Key;
      const uploadResult = await functions.uploadToS3(uploadParams);
      if (uploadResult) {
        console.log("File uploaded Successfully", path);
      }
      if (uploadResult.error) {
        throw new Error(uploadResult.message);
      }
    }
    value.attachment = attachmentFileName;
    const insertInPr = await knex("purchase_requisitions").insert({
      document_type: document_type,
      header_text: header_text,
      pr_no: prno,
      pr_type: pr_type,
      requisitioner: requisitioner,
      total: total,
      delivery_date: delivery_date,
      plant_id: plant_id,
      stor_loc_id: stor_loc_id,
      purchase_grp_id: purchase_grp_id,
      purchase_org_id: purchase_org_id,
      attachment: value.attachment,
      created_at: currentDateIST,
      updated_at: currentDateIST,
    });
    if (!insertInPr) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Unable to insert data",
        })
        .end();
    }
    const itemsToInsert = pr_data.map((item) => ({
      pr_id: insertInPr[0],
      ...item,
    }));

    // Inserting data into purchase_requisition_items table
    const insertedItems = await knex("purchase_requisition_items").insert(
      itemsToInsert
    );

    if (!insertedItems.length) {
      return res.status(500).json({
        error: true,
        message: "Unable to insert data into purchase_requisition_items table",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Data inserted successfully",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error.message),
    });
  }
};

const updatePr = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const reqBody = req.body;

    const transformedBody = {
      id: reqBody.id,
      document_type: reqBody.document_type,
      header_text: reqBody.header_text,
      pr_type: reqBody.pr_type,
      delivery_date: reqBody.delivery_date,
      plant_id: reqBody.plant_id,
      stor_loc_id: reqBody.stor_loc_id,
      purchase_grp_id: reqBody.purchase_grp_id,
      purchase_org_id: reqBody.purchase_org_id,
      status: reqBody.status,
      // attachment: reqBody.attachment,
      total: reqBody.total,
      pr_data: [],
    };

    Object.keys(reqBody).forEach((key) => {
      const match = key.match(/^pr_data\[(\d+)\]\./);

      if (match) {
        const index = parseInt(match[1], 10);
        const field = key.replace(`pr_data[${index}].`, "");

        // Ensure the pr_data array has an object at the current index
        if (!transformedBody.pr_data[index]) {
          transformedBody.pr_data[index] = {};
        }

        // Assign the value to the corresponding field
        transformedBody.pr_data[index][field] = reqBody[key];
      }
    });
    const { error, value } = validation.updatePR(transformedBody);

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log("error :", error);
    }

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    //check if pr exist
    const checkPR = await knex("purchase_requisitions")
      .where({ id: value.id, isDeleted: "0" })
      .first();

    if (!checkPR) {
      return res
        .status(404)
        .json({
          error: true,
          message: "Purchase Requisition not found.",
        })
        .end();
    }

    // Checking for foreign Keys
    if (value.plant_id)
      await functions.checkForeignId("plants", value.plant_id);
    if (value.stor_loc_id)
      await functions.checkForeignId("storage_locations", value.stor_loc_id);
    if (purchase_grp_id)
      await functions.checkForeignId("purchase_groups", purchase_grp_id);
    if (purchase_org_id) {
      const check = await knex("purchase_organization")
        .select("purchase_group_id")
        .where("id", purchase_org_id)
        .first();
      console.log(check);
      if (check) {
        if (purchase_grp_id !== check.purchase_group_id) {
          return res.status(400).json({
            error: true,
            message:
              "Please select purchase organization of given purchase group.",
          });
        }
      }
      await functions.checkForeignId("purchase_organization", purchase_org_id);
    }
    for (const item of value.pr_data) {
      try {
        if (item.material_id)
          await functions.checkForeignId("materials", item.material_id);
        if (item.matl_group_id)
          await functions.checkForeignId("material_group", item.matl_group_id);
        if (item.uom_id) await functions.checkForeignId("units", item.uom_id);
      } catch (error) {
        return res.status(422).json({ error: true, message: error.message });
      }
      if (item.service_id) {
        const service = await knex("services")
          .where("id", item.service_id)
          .first();

        if (!service) {
          return res.status(404).json({
            error: true,
            message: "Service Not Found",
            data: [],
          });
        }
        if (service.name !== item.short_text) {
          return res.status(400).json({
            error: true,
            message: "Service and Short Text should be same.",
          });
        }
      }

      if (item.material_id) {
        const materialData = await knex("materials")
          .where("id", item.material_id)
          .first();
        if (materialData.name !== item.short_text) {
          return res.status(400).json({
            error: true,
            message: "Material and Short Text should be same.",
          });
        }
      }
    }
    let attachmentFileName;
    let uploadParams = {};
    let path;
    if (req.files && req.files.attachment) {
      const attachment = req.files.attachment;
      const allowedFileTypes = ["jpg", "png", "pdf", "jpeg"];
      const fileExtension = attachment.name.split(".").pop().toLowerCase();

      if (!allowedFileTypes.includes(fileExtension)) {
        return res.status(400).json({
          error: true,
          message: "Only jpg, png, pdf, and jpeg file formats are allowed",
        });
      }
      attachmentFileName = new Date().getTime() + "-" + attachment.name;

      // Upload attachment to S3
      uploadParams = {
        Bucket: constants.s3Creds.bucket,
        Key: "content-server/purchase_requisition/" + attachmentFileName,
        Body: attachment.data,
      };

      path = constants.admindetails.homePageUrl + uploadParams.Key;
      const uploadResult = await functions.uploadToS3(uploadParams);
      if (uploadResult) {
        console.log("File uploaded Successfully", path);
      }
      if (uploadResult.error) {
        throw new Error(uploadResult.message);
      }
    }

    value.attachment = attachmentFileName;

    const updateData = {
      document_type: value.document_type,
      header_text: value.header_text,
      pr_no: value.prno,
      pr_type: value.pr_type,
      requisitioner: value.requisitioner,
      total: value.total,
      delivery_date: value.delivery_date,
      plant_id: value.plant_id,
      stor_loc_id: value.stor_loc_id,
      purchase_grp_id: value.purchase_grp_id,
      purchase_org_id: value.purchase_org_id,
      attachment: value.attachment,
      status: value.status,
      updated_at: currentDateIST,
    };

    const updationDataIs = await functions.takeSnapShot(
      "purchase_requisitions",
      value.id
    );
    const updatePR = await knex("purchase_requisitions")
      .where({ id: value.id })
      .update(updateData);
    if (!updatePR) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Unable to update",
        })
        .end();
    }
    if (value) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "purchase_requisitions",
        "id",
        value.id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    const itemsToInsert = value.pr_data.map((item) => ({
      pr_id: value.id,
      ...item,
    }));

    // Inserting data into purchase_requisition_items table
    const del = await knex("purchase_requisition_items")
      .del()
      .where({ pr_id: value.id });
    const insertedItems = await knex("purchase_requisition_items").insert(
      itemsToInsert
    );

    if (!insertedItems.length) {
      return res.status(500).json({
        error: true,
        message: "Unable to Update data into purchase_requisition_items table",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Data updated successfully",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record",
      data: JSON.stringify(error.message),
    });
  }
};

const deletePr = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const pr_item = "purchase_requisition_items";

    const { error, value } = validation.deletePR(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const getId = await knex(tableName).where({ id, isDeleted: "0" }).first();

    if (!getId) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
    const updationDataIs = await functions.takeSnapShot(tableName, getId.id);
    const result = await knex(tableName)
      .where({ id, isDeleted: "0" })
      .update({ isDeleted: "1" });
    if (!result) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "purchase_requisitions",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    if (result) {
      const getId = await knex(pr_item).where({ pr_id: id }).first();
      const updationDataIs = await functions.takeSnapShot(pr_item, getId.id);
      const delpr = await knex(pr_item)
        .where({ pr_id: id })
        .update({ isDeleted: "1" });

      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "purchase_requisition_items",
          "pr_id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
      return res.status(200).json({
        error: false,
        message: "Record deleted successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error.message),
    });
  }
};

const viewPr = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const pr_item = "purchase_requisition_items";
    const materials = "materials";
    const m_group = "material_group";
    const units = "units";
    const stor_locs = "storage_locations";
    const services = "services";
    const plants = "plants";
    const pOrg = "purchase_organization";

    const { error, value } = validation.view(req.params);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    const result = await knex(`${tableName}`)
      .select(
        `${tableName}.*`,
        "users.firstname as requisitioner",
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`material_id`) as material_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`service_id`) as service_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`matl_group_id`) as matl_group_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`short_text`) as short_text"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`quantity`) as quantity"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`uom_id`) as uom_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`subtotal`) as subtotal"
        ),
        knex.raw("GROUP_CONCAT(`purchase_requisition_items`.`price`) as price"),
        // knex.raw("GROUP_CONCAT(`materials`.`name`) as material"),
        knex.raw("GROUP_CONCAT(`materials`.`code`) as material_code"),
        knex.raw("GROUP_CONCAT(`material_group`.`name`) as matl_group"),
        knex.raw("GROUP_CONCAT(`units`.`name`) as unit"),
        knex.raw("GROUP_CONCAT(`services`.`code`) as service_code"),
        "plants.name as plant",
        "storage_locations.name as storage_location",
        "purchase_organization.description as purchase_organization"
      )
      .leftJoin(`${pr_item}`, function () {
        this.on(`${tableName}.id`, `${pr_item}.pr_id`).andOn(
          knex.raw(`${pr_item}.isDeleted = ?`, "0")
        );
      })
      .leftJoin(`${materials}`, `${pr_item}.material_id`, `${materials}.id`)
      .leftJoin(`${m_group}`, `${pr_item}.matl_group_id`, `${m_group}.id`)
      .leftJoin(`${units}`, `${pr_item}.uom_id`, `${units}.id`)
      .leftJoin(`${services}`, `${pr_item}.service_id`, `${services}.id`)
      .leftJoin(`${plants}`, function () {
        this.on(
          knex.raw(`\`${tableName}\`.\`plant_id\` COLLATE utf8mb4_general_ci`),
          `${plants}.id`
        );
      })
      .leftJoin(`${stor_locs}`, `${tableName}.stor_loc_id`, `${stor_locs}.id`)
      .leftJoin(`${pOrg}`, `${tableName}.purchase_org_id`, `${pOrg}.id`)
      .leftJoin("users", `${tableName}.requisitioner`, `users.id`)
      .groupBy("purchase_requisitions.id")
      .where({
        "purchase_requisitions.id": id,
        "purchase_requisitions.isDeleted": "0",
      });

    if (result.length == 0) {
      return res.json({
        error: true,
        message: "Records not found",
        data: error,
      });
    }

    // Transform the result into the desired format
    const formattedResult = await Promise.all(
      result.map(async (item) => {
        if (
          item.attachment !== undefined &&
          item.attachment !== null &&
          item.attachment !== ""
        ) {
          const imageBucket = process.env.S3_BUCKET;
          const imageKey =
            "content-server/purchase_requisition/" + item.attachment;
          const expirationInSeconds = 3600;
          item.attachment = await functions.generatePresignedUrl(
            imageBucket,
            imageKey,
            expirationInSeconds
          );
        }
        const pr_data = [];

        const materialIds = item.material_id
          ? item.material_id.split(",").map(Number)
          : [];
        const serviceIds = item.service_id
          ? item.service_id.split(",").map(Number)
          : [];
        const materialCodes = item.material_code
          ? item.material_code.split(",")
          : [];
        const service_code = item.service_code
          ? item.service_code.split(",")
          : [];
        const shortTexts = item.short_text ? item.short_text.split(",") : [];
        const matlGroupIds = item.matl_group_id
          ? item.matl_group_id.split(",").map(Number)
          : [];
        const matlGroups = item.matl_group ? item.matl_group.split(",") : [];
        const quantities = item.quantity
          ? item.quantity.split(",").map(Number)
          : [];
        const uomIds = item.uom_id ? item.uom_id.split(",").map(Number) : [];
        const units = item.unit ? item.unit.split(",") : [];
        const prices = item.price ? item.price.split(",").map(Number) : [];
        const subtotal = item.subtotal
          ? item.subtotal.split(",").map(Number)
          : [];

        // Iterate over each item in the purchase requisition and create the desired structure
        for (let i = 0; i < shortTexts.length; i++) {
          pr_data.push({
            id: materialIds[i] || serviceIds[i],
            code: materialCodes[i] || service_code[i] || "",
            short_text: shortTexts[i] ? shortTexts[i] : "",
            material_group: {
              id: matlGroupIds[i] ? matlGroupIds[i] : "",
              name: matlGroups[i] ? matlGroups[i] : "",
            },
            quantity: quantities[i] ? quantities[i] : "",
            uom: {
              id: uomIds[i] ? uomIds[i] : "",
              unit: units[i] ? units[i] : "",
            },
            price: prices[i] ? prices[i] : "",
            subtotal: subtotal[i] ? subtotal[i] : "",
          });
        }

        // Remove unnecessary properties from the main object
        delete item.material_id;
        delete item.matl_group_id;
        delete item.item_text;
        delete item.short_text;
        delete item.quantity;
        delete item.uom_id;
        const Delete = [
          "subscriber_id",
          "price",
          "material",
          "material_code",
          "matl_group",
          "unit",
          "plant_code",
          "plant_name",
          "stor_code",
          "stor_name",
          "supplier_name",
          "supplier_code",
          "sub_number",
          "subtotal",
          "service_id",
          "service_code",
          "service",
          "item_text",
        ];

        for (const key of Delete) {
          delete item[key];
        }

        return {
          ...item,
          pr_data,
        };
      })
    );

    return res.json({
      error: false,
      message: "Purchase Requisitions found successfully",
      data: formattedResult,
    });
  } catch (error) {
    console.log(error.message);
    return res.json({
      error: true,
      message: "Something went wrong",
      data: error.message,
    });
  }
};

const paginatePr = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const pr_item = "purchase_requisition_items";
    const materials = "materials";
    const m_group = "material_group";
    const units = "units";
    const stor_locs = "storage_locations";
    const services = "services";
    const plants = "plants";
    const pOrg = "purchase_organization";
    const pGrp = "purchase_groups";

    const searchFrom = [
      "document_type",
      "header_text",
      "pr_type",
      "materials.name",
      "material_group.name",
      "plants.name",
      "storage_locations.name",
    ];

    const { error, value } = validation.paginatePR(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let {
      offset,
      limit,
      order,
      sort,
      search,
      status,
      material,
      material_group,
      stor_loc,
      plant,
      filter,
      type,
    } = value;

    let results = knex(`${tableName}`).where({ isDeleted: "0" });

    if (status != undefined && status != "") {
      results = results.where(`${tableName}.status`, status);
    }

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(`${tableName}.${element}`, `%${search}%`);
        });
      }
    });

    let rows = knex(`${tableName}`)
      .select(
        `${tableName}.*`,
        "users.firstname as requisitioner",
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`material_id`) as material_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`service_id`) as service_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`matl_group_id`) as matl_group_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`short_text`) as short_text"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`quantity`) as quantity"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`uom_id`) as uom_id"
        ),
        knex.raw(
          "GROUP_CONCAT(`purchase_requisition_items`.`subtotal`) as subtotal"
        ),
        knex.raw("GROUP_CONCAT(`purchase_requisition_items`.`price`) as price"),
        // knex.raw("GROUP_CONCAT(`materials`.`name`) as material"),
        knex.raw("GROUP_CONCAT(`materials`.`code`) as material_code"),
        knex.raw("GROUP_CONCAT(`material_group`.`name`) as matl_group"),
        knex.raw("GROUP_CONCAT(`units`.`name`) as unit"),
        knex.raw("GROUP_CONCAT(`services`.`code`) as service_code"),
        "plants.name as plant",
        "storage_locations.name as storage_location",
        "purchase_organization.description as purchase_organization",
        "purchase_groups.name as purchase_group"
      )
      .leftJoin(`${pr_item}`, function () {
        this.on(`${tableName}.id`, `${pr_item}.pr_id`).andOn(
          knex.raw(`${pr_item}.isDeleted = ?`, "0")
        );
      })
      .leftJoin(`${materials}`, `${pr_item}.material_id`, `${materials}.id`)
      .leftJoin(`${m_group}`, `${pr_item}.matl_group_id`, `${m_group}.id`)
      .leftJoin(`${units}`, `${pr_item}.uom_id`, `${units}.id`)
      .leftJoin(`${services}`, `${pr_item}.service_id`, `${services}.id`)
      .leftJoin(`${plants}`, function () {
        this.on(
          knex.raw(`\`${tableName}\`.\`plant_id\` COLLATE utf8mb4_general_ci`),
          `${plants}.id`
        );
      })
      // .leftJoin(`${plants}`, `${tableName}.plant_id`, `${plants}.id`)
      .leftJoin(`${stor_locs}`, `${tableName}.stor_loc_id`, `${stor_locs}.id`)
      .leftJoin(`${pOrg}`, `${tableName}.purchase_org_id`, `${pOrg}.id`)
      .leftJoin(`${pGrp}`, `${tableName}.purchase_grp_id`, `${pGrp}.id`)
      .leftJoin("users", `${tableName}.requisitioner`, `users.id`)
      .groupBy("purchase_requisitions.id")
      .where({ "purchase_requisitions.isDeleted": "0" });

    if (status != undefined && status != "") {
      rows = rows.where(`${tableName}.status`, status);
    }
    if (type != undefined && type != "") {
      rows = rows.where(`${tableName}.pr_type`, type);
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        if (dateField == "delivery_date") {
          rows.whereBetween("purchase_requisition_items.delivery_date", [
            startDate,
            endDate,
          ]);
        } else if (dateField === "created_at") {
          rows.whereBetween("purchase_requisitions.created_at", [
            startDateISO,
            endDateISO,
          ]);
        } else if (dateField === "updated_at") {
          rows.whereBetween("purchase_requisitions.updated_at", [
            startDateISO,
            endDateISO,
          ]);
        }
      }
    }

    try {
      rows = functions.applyFilter(rows, "materials.name", material);
      rows = functions.applyFilter(rows, "material_group.name", material_group);
      rows = functions.applyFilter(rows, "storage_locations.name", stor_loc);
      rows = functions.applyFilter(rows, "plants.name", plant);
    } catch (error) {
      return res.status(422).json({ error: true, message: error.message });
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(`${element}`, `%${search}%`);
          });
        });
      }
    });

    const total = await rows.clone().count("purchase_requisitions.id as total");
    rows = await rows
      .orderBy(`${tableName}.${sort}`, order)
      .limit(limit)
      .offset(offset);

    let sr;
    let data_rows = [];
    if (order === "desc") {
      sr = offset + 1;
    } else {
      sr = total.length - limit * offset;
      console.log(total.length);
    }

    rows = await Promise.all(
      rows.map(async (row) => {
        if (row.attachment) {
          const imageBucket = process.env.S3_BUCKET;
          const imageKey =
            "content-server/purchase_requisition/" + row.attachment;
          const expirationInSeconds = 3600;
          row.attachment = await functions.generatePresignedUrl(
            imageBucket,
            imageKey,
            expirationInSeconds
          );
        }

        const material_ids = row.material_id
          ? row.material_id.split(",").map(Number)
          : [];
        const service_ids = row.service_id
          ? row.service_id.split(",").map(Number)
          : [];
        const material_code = row.material_code
          ? row.material_code.split(",")
          : [];
        const service_code = row.service_code
          ? row.service_code.split(",")
          : [];
        const short_texts = row.short_text ? row.short_text.split(",") : [];
        const matl_group_ids = row.matl_group_id
          ? row.matl_group_id.split(",").map(Number)
          : [];
        const matl_group = row.matl_group ? row.matl_group.split(",") : [];
        const quantities = row.quantity
          ? row.quantity.split(",").map(Number)
          : [];
        const uom_ids = row.uom_id ? row.uom_id.split(",").map(Number) : [];
        const unit = row.unit ? row.unit.split(",") : [];
        const prices = row.price ? row.price.split(",").map(Number) : [];
        const subtotals = row.subtotal
          ? row.subtotal.split(",").map(Number)
          : [];

        const pr_data = short_texts.map((_, index) => ({
          id: material_ids[index] || service_ids[index],
          code: material_code[index] || service_code[index] || "",
          short_text: short_texts[index] || "",
          material_group: {
            id: matl_group_ids[index] || "",
            name: matl_group[index] || "",
          },
          quantity: quantities[index] || "",
          uom: {
            id: uom_ids[index] || "",
            unit: unit[index] || "",
          },
          price: prices[index] || "",
          subtotal: subtotals[index] || "",
        }));
        const Delete = [
          "subscriber_id",
          "material",
          "item_text",
          "material_code",
          "service_code",
          "matl_group",
          "unit",
          "plant_code",
          // "plant_name",
          "stor_code",
          // "stor_name",
          "supplier_name",
          "supplier_code",
          "sub_number",
          "stor_loc_id",
          "plant_id",
          "subtotal",
          "service",
          "service_code",
          "service_id",
          "material_id",
          "matl_group_id",
          "sort_text",
          "uom_id",
          "price",
          "short_text",
          "quantity",
        ];

        for (const key of Delete) {
          delete row[key];
        }
        row = {
          ...row,
          pr_data,
        };

        row.sr = sr;
        if (order === "desc") {
          sr++;
        } else {
          sr--;
        }
        data_rows.push(row);
      })
    );

    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully.",
      data: {
        total: total.length,
        rows: data_rows,
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: true,
      message: "Could not load record(s).",
      data: error.message,
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "purchase_requisitions";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

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

const fetchPrList = async (req, res) => {
  try {
    if (!csrfToken || !cookie) {
      await getCsrf();
    }

    const { error, value } = validation.fetchPRList(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { fromDate, toDate, search, offset, limit, order, sort } = value;

    let data;
    data = await sapPr.fetchPrList(fromDate, toDate, csrfToken, cookie);
    if (data.error) {
      console.log(data.error);
      // data = await knex("purchase_orders_list").where("supplierId",SUPPLIER).select("PR_NO as PO_NUMBER")
      return res.json({
        error: true,
        message: "Failed to fetch PR List from SAP.",
        data: [],
      });
    }
    if (search) {
      data = data.filter((pr) => pr.PR_NO.includes(search));
    }

    const totalCount = data.length;
    data = data ? data.slice(offset, offset + limit) : [];
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
    return res.json({
      error: false,
      message: "Data is successfully fetched from SAP",
      data: {
        total: totalCount,
        data: data,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
      data: error.message,
    });
  }
};

const fetchPrDetails = async (req, res) => {
  try {
    if (!csrfToken || !cookie) {
      await getCsrf();
    }

    const { error, value } = validation.fetchPRDetails(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { PR_NO } = value;
    const data = await sapPr.fetchPrDetails(PR_NO, csrfToken, cookie);
    if (data.error) {
      console.log(error);
      return res.json({
        error: true,
        message: "Failed to fetch PR from SAP.",
      });
    }

    return res.json({
      error: false,
      message: "Data is successfully fetched from SAP",
      data: {
        PR_NO: PR_NO,
        data: data,
      },
    });
  } catch (error) {
    console.error("Error in fetchPrDetails:", error);
    return res.json({
      error: true,
      message: "Internal server error.",
    });
  }
};

export default {
  createPurchaseRequisitions,
  viewPurchaseRequisitions,
  updatePurchaseRequisitions,
  deletePurchaseRequisitions,
  PaginatePurchaseRequisitions,
  PrStatus,
  PaginatePRandPRItems,
  createPr,
  updatePr,
  viewPr,
  paginatePr,
  deletePr,
  delteMultipleRecords,
  fetchPrList,
  fetchPrDetails,
};
