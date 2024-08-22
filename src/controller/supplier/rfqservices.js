import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import  logs  from "../../middleware/logs.js";
import validation from "../../validation/supplier/rfqservices.js";

const createRfqService = async (req, res) => {
  const tableName = "rfq_services";

  try {

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { rfq_id, service_id, status } = value;
    const created_at = knex.fn.now();
    const checkRfqId = await knex("request_for_quotations").where({
      id: rfq_id,
    });

    if (Array.isArray(checkRfqId) && checkRfqId.length <= 0) {
      return res.json({
        error: true,
        message: "Rfq does not exist",
      });
    }

    const checkServiceId = await knex("services").where({
      id: service_id,
    });

    if (Array.isArray(checkServiceId) && checkServiceId.length <= 0) {
      return res.json({
        error: true,
        message: "Service does not exist",
      });
    }
    const insertId = await knex(tableName).insert({
      rfq_id,
      service_id,
      status,
      created_at,
    });
    if (!insertId) {
      return res.json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }
    return res.json({
      error: false,
      message: "Added successfully.",
      insertId: insertId[0],
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const viewRfqService = async (req, res) => {
  try {
    const tableName = "rfq_services";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({
      id,
    });
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

const updateRfqService = async (req, res) => {
  const tableName = "rfq_services";
  try {
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, rfq_id, service_id, status } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const updated_at = knex.fn.now();
    const checkRfqId = await knex("request_for_quotations").where({
      id: rfq_id,
    });

    if (Array.isArray(checkRfqId) && checkRfqId.length <= 0) {
      return res.json({
        error: true,
        message: "Rfq does not exist",
      });
    }

    const checkServiceId = await knex("services").where({
      id: service_id,
    });

    if (Array.isArray(checkServiceId) && checkServiceId.length <= 0) {
      return res.json({
        error: true,
        message: "Service does not exist",
      });
    }

    const updationDataIs = await functions.takeSnapShot(tableName,id);

    const result = await knex(tableName)
      .where({
        id: id,
      })
      .update({
        id,
        rfq_id,
        service_id,
        status,
        updated_at,
      });
    if (!result) {
      return res.json({
        error: true,
        message: "Update in the database Failed",
      });
    }
    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"rfq_services","id",id);
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.json({
      error: false,
      message: "Updated successfully.",
      data: {
        updatedId: id,
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

const deleteRfqService = async (req, res) => {
  try {
    const tableName = "rfq_services";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.json({
        error: true,
        message: "Field error",
        data: error,
      });
    }

    const { id } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const result = await knex(tableName)
      .where({
        id,
      })
      .update('isDeleted', 1); 

    if (result) {
      return res.json({
        error: false,
        message: "Record deleted successfully",
      });
    } else {
      return res.json({
        error: true,
        message: "Record not found",
      });
    }
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const PaginationRfqService = async (req, res) => {
  try {
    const tableName = "rfq_services";
    const searchFrom = ["service_id"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let { offset, limit, order, sort, search, status } = value;
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

const deleteAllService = async (req, res) => {
  try {
    const { error, value } = validation.deleteAll(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { ids } = value;
    const tableName = "rfq_services";
    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    

    const delete_all_status = await knex(tableName).whereIn("id", ids).update('isDeleted', 1) 

    if (!delete_all_status) {
      return res.json({
        error: true,
        message: "Table is empty",
      });
    }

    return res.json({
      error: false,
      message: "All selected records deleted successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const RfqServiceStatus = async (req, res) => {
  try {

    const { error, value } = validation.status(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, status } = value;

    const current_status_in_table = await knex("rfq_services")
      .where("id", id)
      .select("status");

    if (current_status_in_table.length == 0) {
      return res.json({
        error: true,
        message: "Provieded ID is invalid",
        data: [],
      });
    }

    //draft -> submitted

    if (current_status_in_table[0].status === "draft") {
      if (status === "submitted") {
        //database update with submitted

        const updationDataIs = await functions.takeSnapShot("rfq_services",id);

        const update_db = await knex("rfq_services")
          .where("id", id)
          .update({ status: status });

        if (!update_db) {
          return res.json({
            error: true,
            message: "Unable to update the status",
          });
        }
        if(id){
        const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"rfq_services","id",id);
      console.log("isUpdated:-", modifiedByTable1);
        }
        return res.json({
          error: false,
          message: "The status updated to 'submitted' successfully",
        });
      } else {
        return res.json({
          error: true,
          message: "You can change the status from draft to 'submitted' only",
        });
      }
    } else if (current_status_in_table[0].status === "submitted") {
      if (status === "rejected" || status === "approved") {
        //database update with submitted

        const updationDataIs = await functions.takeSnapShot("rfq_services",id);

        const update_db = await knex("rfq_services")
          .where("id", id)
          .update({ status: status });

        if (!update_db) {
          return res.json({
            error: true,
            message: "Unable to update the status",
          });
        }
        if(id){
        const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"rfq_services","id",id);
      console.log("isUpdated:-", modifiedByTable1);
        }
        return res.json({
          error: false,
          message: `The status updated to ${status} successfully`,
        });
      } else {
        return res.json({
          error: true,
          message:
            "You can change the status from 'submitted' to 'approved'/'rejected' only",
        });
      }
    } else {
      return res.json({
        error: true,
        message: "You can not change the status now",
      });
    }
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};


const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "rfq_services";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
}

export default {
  createRfqService,
  viewRfqService,
  deleteRfqService,
  updateRfqService,
  PaginationRfqService,
  deleteAllService,
  RfqServiceStatus,
  delteMultipleRecords
};
