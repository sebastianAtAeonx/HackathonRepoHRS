import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/purchaseRequisitionItem.js";

const createPrItems = async (req, res) => {
  try {
    const tableName = "purchase_requisition_items";

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, pr_id, item_id, qty, status } = value;

    const created_at = knex.fn.now();

    const InsertId = await knex(tableName).insert({
      id,
      pr_id,
      item_id,
      qty,
      status,
      created_at,
    });

    if (!InsertId) {
      return res.json({
        error: true,
        message: "Unable to create purchase requisition item",
      });
    }

    return res.json({
      error: false,
      message: "Purchase requisition item created successfully!",
      data: { InsertId: id },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const viewPurchaseRequisitionItems = async (req, res) => {
  try {
    const tableName = "purchase_requisition_items";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({ id });
    if (result == "") {
      return res.json({
        error: true,
        message: "Record not found",
      });
    }
    return res.json({
      error: false,
      message: "Record found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updatePurchaseRequisitionItems = async (req, res) => {
  try {
    const tableName = "purchase_requisition_items";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, pr_id, item_id, qty, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const updated_at = knex.fn.now();

    const updationDataIs = await functions.takeSnapShot(tableName, id);

    const InsertId = await knex(tableName).where({ id: id }).update({
      pr_id,
      item_id,
      qty,
      status,
      updated_at,
    });
    if (!InsertId) {
      return res.json({
        error: true,
        message: "Unable to update purchase requisition item",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "purchase_requisition_items",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.json({
      error: false,
      message: "Purchase requisition item updated successfully",
      data: { InsertId: id },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const deletePurchaseRequisitionItems = async (req, res) => {
  try {
    const tableName = "purchase_requisition_items";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.json({
        error: true,
        message: "Field error",
        data: error,
      });
    }

    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const result = await knex(tableName).where({ id }).delete();

    if (result) {
      return res.json({ message: "Record deleted successfully" });
    } else {
      return res.json({ message: "Record not found" }).status(404);
    }
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const PaginatePurchaseRequisitionItems = async (req, res) => {
  try {
    const tableName = "purchase_requisition_items";

    const searchFrom = ["qty"];

    const { error, value } = validation.paginate(req.body);

    if (error) {
      return res.json({
        error: true,

        message: error.details[0].message,

        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;

    let results = knex(tableName);

    let total = 0;

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
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};
const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "purchase_requisition_items";
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

export default {
  createPrItems,
  viewPurchaseRequisitionItems,
  updatePurchaseRequisitionItems,
  deletePurchaseRequisitionItems,
  PaginatePurchaseRequisitionItems,
  delteMultipleRecords,
};
