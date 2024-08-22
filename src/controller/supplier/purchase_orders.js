import Joi from "joi";
import knex from "../../config/mysql_db.js";
import moment from "moment";
import functions from "../../helpers/functions.js";
import validation from "../../validation/supplier/purchase_orders.js";

// const createPurchaseOrder = async (req, res) => {
//   try {
//     const serviceSchema = Joi.object({
//       service_id: Joi.number().required(),
//       rfq_id: Joi.number().required(),
//       unit_id: Joi.number().required(),
//       units: Joi.number().required(),
//       price: Joi.number().required(),
//       status: Joi.valid("pending", "submitted", "rejected", "approved").default(
//         "pending"
//       ),
//     });

//     const itemSchema = Joi.object({
//       item_id: Joi.number().required(),
//       qty: Joi.number().required(),
//       price: Joi.number().required(),
//       unit_id: Joi.number().required(),

//       status: Joi.valid(
//         "pending",
//         "processing",
//         "shipped",
//         "delivered",
//         "cancelled",
//         "returned",
//         "refunded",
//         "onhold",
//         "backordered",
//         "pending_review",
//         "fraud_alert",
//         "payment_failed",
//         "partially_shipped",
//         "processing_delayed",
//         "out_for_delivery",
//         "failed_delivery_attempt",
//         "awaiting_pickup"
//       ).default("pending"),
//     });

//     const schema = Joi.object({
//       subscriber_id: Joi.number().required(),
//       plant_id: Joi.string().required(),
//       supplier_id: Joi.string().required(),
//       user_id: Joi.number().required(),
//       order_date: Joi.string().required(),
//       delivery_date: Joi.string(),
//       total_amount: Joi.number().default(0),
//       payment_status: Joi.valid("pending", "paid").default("pending"),
//       approval_status: Joi.valid("pending", "approved", "rejected").default(
//         "pending"
//       ),
//       po_type: Joi.valid("item", "service").required(),
//       po_items: Joi.when("po_type", {
//         is: "item",
//         then: Joi.array().items(itemSchema).required(),
//         otherwise: Joi.forbidden(),
//       }),
//       po_services: Joi.when("po_type", {
//         is: "service",
//         then: Joi.array().items(serviceSchema).required(),
//         otherwise: Joi.forbidden(),
//       }),
//     });

//     const { error, value } = schema.validate(req.body);

//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: [],
//       });
//     }

//     const {
//       subscriber_id,
//       plant_id,
//       user_id,
//       supplier_id,
//       order_date,
//       delivery_date,
//       total_amount,
//       payment_status,
//       approval_status,
//       po_type,
//     } = value;

//     const created_at = knex.fn.now();
//     const insertPoId = await knex("purchase_orders").insert({
//       subscriber_id,
//       plant_id,
//       supplier_id,
//       user_id,
//       order_date,
//       delivery_date,
//       total_amount,
//       payment_status,
//       approval_status,
//       po_type,
//       created_at,
//     });
//     if (!insertPoId) {
//       return res.json({
//         error: true,
//         message: "Unable to add in database",
//       });
//     }

//     let final_total = 0;

//     if (value.po_type === "item") {
//       for (const item of value.po_items) {
//         item.po_id = insertPoId[0];
//         item.subtotal = item.qty * item.price;
//         final_total += item.subtotal;
//         const insertPoItem = await knex("purchase_order_items").insert(item);
//         if (!insertPoItem) {
//           return res.json({
//             error: true,
//             message: "Unable to add to Purchase order items",
//           });
//         }
//       }
//     } else {
//       for (const service of value.po_services) {
//         service.po_id = insertPoId[0];
//         service.subtotal = service.units * service.price;
//         final_total += service.subtotal;
//         const isertInPoService = await knex("purchase_order_services").insert(
//           service
//         );
//         if (!isertInPoService) {
//           return res.json({
//             error: true,
//             message: "Unable to add to Purchase order services",
//           });
//         }
//       }
//     }

//     //update total in purchase_order table

//     const updated_total = await knex("purchase_orders")
//       .update({
//         total_amount: final_total,
//       })
//       .where("id", insertPoId[0]);

//     if (!updated_total) {
//       return res.json({
//         error: true,
//         message: "Total could not be updated",
//       });
//     }

//     return res.json({
//       error: false,
//       message: "Data submitted successfully",
//       insertPoId: insertPoId[0],
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//     });
//   }
// };

const viewPurchaseOrder = async (req, res) => {
  try {
    const tableName = "purchase_orders";
    const { error, value } = validation.view(req.params);
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

    for (const iterator of result) {
      const getPlantName = await knex("plants")
        .where({ id: iterator.plant_id })
        .select("name");
      iterator.plantName = getPlantName[0].name;

      const getSupplierName = await knex("supplier_details")
        .where({ id: iterator.supplier_id })
        .select("supplier_name");

      iterator.supplierName = getSupplierName[0].supplier_name;
    }

    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Purchase order not found",
        data: error,
      });
    }
    let items = [];
    let services = [];
    if (result[0].po_type === "item") {
      const get_result = await knex("purchase_order_items").where(
        "po_id",
        result[0].id
      );
      for (const iterator of get_result) {
        console.log("iterator", iterator.item_id);
        const getItemName = await knex("items")
          .where({ id: iterator.item_id })
          .select("name");
        iterator.itemName = getItemName[0].name;
      }

      if (get_result.length > 0) {
        for (const iterator of get_result) {
          items.push(iterator);
        }
      }
      result[0].items = items;
    } else if (result[0].po_type === "service") {
      const get_result = await knex("purchase_order_services").where(
        "po_id",
        result[0].id
      );

      if (get_result.length > 0) {
        for (const iterator of get_result) {
          services.push(iterator);
        }
      }
      result[0].services = services;
    }

    return res.status(200).json({
      error: false,
      message: "View successful",
      data: result,
    });
  } catch {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data:JSON.stringify(error)
    });
  }
};

// const updatePurchaseOrder = async (req, res) => {
//   try {
//     const itemSchema = Joi.object({
//       id: Joi.number().required(),
//       item_id: Joi.number().required(),
//       qty: Joi.number().required(),
//       unit_id: Joi.number().required(),
//       //subtotal: Joi.number().required(),
//       // status: Joi.valid(
//       //   "pending",
//       //   "processing",
//       //   "shipped",
//       //   "delivered",
//       //   "cancelled",
//       //   "returned",
//       //   "refunded",
//       //   "onhold",
//       //   "backordered",
//       //   "pending_review",
//       //   "fraud_alert",
//       //   "payment_failed",
//       //   "partially_shipped",
//       //   "processing_delayed",
//       //   "out_for_delivery",
//       //   "failed_delivery_attempt",
//       //   "awaiting_pickup"
//       // ).default("pending"),
//     });

//     const serviceSchema = Joi.object({
//       id: Joi.number().required(),
//       service_id: Joi.number().required(),
//       rfq_id: Joi.number().required(),
//       unit_id: Joi.number().required(),
//       units: Joi.number().required(),
//       //subtotal: Joi.number().required(),
//       status: Joi.valid("pending", "submitted", "rejected", "approved").default(
//         "pending"
//       ),
//     });

//     const schema = Joi.object({
//       id: Joi.number().required(),
//       subscriber_id: Joi.number().required(),
//       user_id: Joi.number().required(),
//       plant_id: Joi.number().required(),
//       supplier_id: Joi.number().required(),
//       order_date: Joi.string().required(),
//       delivery_date: Joi.string(),
//       total_amount: Joi.number().required(),
//       payment_status: Joi.valid("pending", "paid").default("pending"),
//       approval_status: Joi.valid("pending", "approved", "rejected").default(
//         "pending"
//       ),
//       po_type: Joi.valid("item", "service").required(),
//       po_items: Joi.when("po_type", {
//         is: "item",
//         then: Joi.array().items(itemSchema).required(),
//         otherwise: Joi.forbidden(),
//       }),
//       po_services: Joi.when("po_type", {
//         is: "service",
//         then: Joi.array().items(serviceSchema).required(),
//         otherwise: Joi.forbidden(),
//       }),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: [],
//       });
//     }

//     const {
//       id,
//       subscriber_id,
//       plant_id,
//       supplier_id,
//       user_id,
//       order_date,
//       delivery_date,
//       total_amount,
//       payment_status,
//       approval_status,
//       po_type,
//     } = value;

//     // const dateString = order_date;
//     // const parts = dateString.split("-");
//     // const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
//     // const o_date = dateObject;

//     // const dateString2 = delivery_date;
//     // const parts2 = dateString2.split("-");
//     // const dateObject2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);
//     // const d_date = dateObject2;

//     const update_po = await knex("purchase_orders").where("id", id).update({
//       subscriber_id,
//       plant_id,
//       user_id,
//       supplier_id,
//       order_date,
//       delivery_date,
//       total_amount,
//       payment_status,
//       approval_status,
//       po_type,
//     });
//     if (!update_po) {
//       return res.json({
//         error: false,
//         message: "Update in database failed",
//       });
//     }

//     let final_total = 0;

//     // const myresult =conv.conversion(5,1,1024)
//     // console.log("myresult:-",myresult);

//     if (value.po_type === "item") {
//       for (const item of value.po_items) {
//         item.po_id = id;
//         item.subtotal = item.price * item.qty;
//         final_total += item.subtotal;
//         const updateInPoItem = await knex("purchase_order_items")
//           .where("id", item.id)
//           .whereNot("status", "cancelled")
//           .update(item);
//       }
//     } else {
//       for (const service of value.po_services) {
//         const get_price = await knex("services")
//           .where("id", service.service_id)
//           .select("price")
//           .first();

//         service.po_id = id;
//         service.price = get_price.price;

//         service.subtotal = service.price * service.units;
//         final_total += service.subtotal;

//         const updateInPoService = await knex("purchase_order_services")
//           .where("id", service.id)
//           .whereNotIn("status", ["submitted", "approved", "rejected"])
//           .update(service);
//       }
//     }

//     //update total in purchase_order table

//     const updated_total = await knex("purchase_orders")
//       .update({
//         total_amount: final_total,
//       })
//       .where("id", id);

//     if (!updated_total) {
//       return res.json({
//         error: true,
//         message: "Total could not be updated",
//       });
//     }

//     return res.json({
//       error: false,
//       message: "Record updated successfully",
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//     });
//   }
// };

const deletePurchaseOrder = async (req, res) => {
  try {
    const tableName = "purchase_orders";
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: "Field error",
        data: error,
      });
    }
    const { id } = value;

    const result = await knex(tableName)
      .where({
        id,
      })
      .delete();

    if (result) {
      return res.status(200).json({
        message: "Record deleted successfully",
      });
    } else {
      return res.status(404)
        .json({
          message: "Record not found",
        })
        .status(404);
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "purchase_orders";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result",result)
  
    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
}

const PaginatePurchaseOrder = async (req, res) => {
  try {
    const searchFrom = ["subscriber_id"];
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error.details,
      });
    }

    let { id, offset, limit, order, sort, search, status } = value;

    let query = knex("purchase_orders").whereLike(searchFrom, `%${search}%`);

    if (status != "") {
      query = query.where("status", status);
    }

    query = query.offset(offset).limit(limit).orderBy(sort, order);

    const purchase_orders = await query;

    const totalQuery = query;
    const total = await totalQuery;

    for (const PurchaseOrders of purchase_orders) {
      let items;

      if (PurchaseOrders.po_type == "service") {
        items = await knex("purchase_order_services").where(
          "po_id",
          PurchaseOrders.id
        );

        for (const iterator of items) {
          if (iterator.item_id != null) {
            const get_name_of_service = await knex("services").where(
              "id",
              iterator.item_id
            );

            if (get_name_of_service.length > 0) {
              iterator.item_name = get_name_of_service[0].name;
            }
          }
        }
        PurchaseOrders.services = items;
      } else {
        items = await knex("purchase_order_items")
          .select(
            "id",
            "po_id",
            "item_id",
            "qty",
            "price",
            "unit_id",
            "subtotal"
          )
          .where("po_id", PurchaseOrders.id);

        for (const iterator of items) {
          const get_name_of_item = await knex("items").where(
            "id",
            iterator.item_id
          );

          if (get_name_of_item.length > 0) {
            iterator.item_name = get_name_of_item[0].name;
          }
        }
        PurchaseOrders.items = items;
      }
    }

    if (purchase_orders.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No purchase orders found.",
        data: purchase_orders,
        total: total.length,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: {
        PurchaseOrders: purchase_orders,
        total: total.length,
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

//Code by Rahul Gusai
const createPurchaseOrder = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    
    const {
      PO_NUMBER,
      PO_HEADER,
      PO_ADDRESS,
      PO_ITEMS,
      PO_ITEM_SERVICES,
      PO_ITEM_SCHEDULES,
      IT_TAXES,
    } = value;

    const checkPoInDB = await knex("po_company").where({ poNo: PO_NUMBER });
    if (checkPoInDB.length > 0) {
      return res.json({
        error: true,
        message: "PO already exists",
      });
    }

    const data = {
      PO_HEADER,
      PO_ADDRESS,
      PO_ITEMS,
      PO_ITEM_SERVICES,
      PO_ITEM_SCHEDULES,
      IT_TAXES,
    };

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const insertPo = await knex("po_company").insert({
      poNo: PO_NUMBER,
      poData: JSON.stringify(data),
      createdAt: currentDateIST,
      updatedAt: currentDateIST,
    });
    if (insertPo <= 0) {
      return res.json({
        error: true,
        message: "Failed to insert into PO",
      });
    }
    return res.json({
      error: false,
      message: "PO created successfully",
      data: insertPo,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const {
      PO_NUMBER,
      PO_HEADER,
      PO_ADDRESS,
      PO_ITEMS,
      PO_ITEM_SERVICES,
      PO_ITEM_SCHEDULES,
      IT_TAXES,
    } = value;
   
    const data = {
      PO_NUMBER,
      PO_HEADER,
      PO_ADDRESS,
      PO_ITEMS,
      PO_ITEM_SERVICES,
      PO_ITEM_SCHEDULES,
      IT_TAXES,
    };

    //check if po exist
    const checkPo=await knex("po_company").where({poNo:PO_NUMBER})
    if(!checkPo){
      return res.json({
        error:true,
        message:"This PO number does not exist"
      }).end()
    }

    const getId = await knex("po_company").where({ poNo: PO_NUMBER }).select("id");
    const updationDataIs = await functions.takeSnapShot("po_company",getId.id);
    const updatePo=await knex("po_company").where({poNo:PO_NUMBER}).update({
      poData: JSON.stringify(data),
    })
    if(!updatePo){
      return res.json({
        error:true,
        message:"Unable to update"
      }).end()
    }
    if(PO_NUMBER){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"po_company","poNo",PO_NUMBER);
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.json({
      error:true,
      message:"Data updated successfully",
      data:updatePo.id
    })
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Something went wrong", data: error });
  }
};

export default {
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  PaginatePurchaseOrder,
  viewPurchaseOrder,
  deletePurchaseOrder,
  delteMultipleRecords
};
