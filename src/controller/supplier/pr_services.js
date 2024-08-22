import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/pr_service.js";

const createService = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { pr_id, service_id } = value;

    const check_pr_id = await knex("purchase_requisitions").where("id", pr_id);

    if (check_pr_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "PR does not exist",
      });
    }

    const check_service_id = await knex("services").where("id", service_id);

    if (check_service_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Service does not exist",
      });
    }

    const status = "draft";

    const insert_record = await knex("pr_services").insert({
      pr_id,
      service_id,
      status,
    });

    if (!insert_record) {
      return res.status(500).json({
        error: true,
        message: "Record submittion failed",
      });
    }

    return res.status(201).json({
      error: true,
      message: "Record submitted successfully",
      data: insert_record[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const updateService = async (req, res) => {
  try {
    const tableName = "pr_services";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, pr_id, service_id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check_pr_id = await knex("purchase_requisitions").where("id", pr_id);

    if (check_pr_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "PR does not exist",
      });
    }

    const check_service_id = await knex("services").where("id", service_id);

    if (check_service_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Service does not exist",
      });
    }

    const update_record = await knex("pr_services").where("id", id).update({
      pr_id: pr_id,
      service_id: service_id,
    });

    if (!update_record) {
      return res.status(500).json({
        error: true,
        message: "Update failed",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "pr_services",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Record updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const tableName = "pr_services";

    const { error, value } = validation.del(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const delete_record = await knex("pr_services")
      .where("id", id)
      .update("isDeleted", 1);

    if (!delete_record) {
      return res.status(500).json({
        error: true,
        message: "Delete failed",
      });
    }

    return res.status(200).json({
      error: true,
      message: "Record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteAllService = async (req, res) => {
  try {
    const { error, value } = validation.delelteAllService(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { ids } = value;

    const tableName = "pr_services";

    const delete_all_status = await knex(tableName)
      .whereIn("id", ids)
      .update("isDeleted", 1);

    if (!delete_all_status) {
      return res.status(500).json({
        error: true,
        message: "Table is empty",
      });
    }

    return res.status(200).json({
      error: false,
      message: "All selected records deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const PaginationService = async (req, res) => {
  try {
    const tableName = "pr_services";
    const searchFrom = ["id"];

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

      message: "Could not load record.",

      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

const viewService = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    const get_record = await knex("pr_services").where("id", id);

    if (get_record.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Data retrived successfully",
      data: get_record[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const changeStatusService = async (req, res) => {
  try {
    const { error, value } = validation.changeStatus(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, status } = value;

    const current_status_in_table = await knex("pr_services")
      .where("id", id)
      .select("status");

    if (current_status_in_table.length == 0) {
      return res.status(400).json({
        error: true,
        message: "Provieded ID is invalide",
        data: [],
      });
    }

    if (current_status_in_table[0].status === "draft") {
      if (status === "submitted") {
        const update_db = await knex("pr_services")
          .where("id", id)
          .update({ status: status });

        if (!update_db) {
          return res.status(500).json({
            error: true,
            message: "Unable to update the status",
          });
        }

        if (id) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "pr_services",
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
          message: "You can change the status from draft to 'submitted' only",
        });
      }
    } else if (current_status_in_table[0].status === "submitted") {
      if (status === "rejected" || status === "approved") {
        const update_db = await knex("pr_services")
          .where("id", id)
          .update({ status: status });

        if (!update_db) {
          return res.status(500).json({
            error: true,
            message: "Unable to update the status",
          });
        }

        if (id) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "pr_services",
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

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "pr_services";
    const { ids } = req.body;

    const result = await fun.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

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
  createService,
  updateService,
  deleteService,
  PaginationService,
  viewService,
  deleteAllService,
  changeStatusService,
  delteMultipleRecords,
};
