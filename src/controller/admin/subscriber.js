import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import  logs  from "../../middleware/logs.js"
import validation from "../../validation/admin/subscriber.js";

const createSubscriber = async (req, res) => {
  try {

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const tableName = "subscribers";

    const { name, email, phone, address, plan_id, status } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const check_email = await knex(tableName).where({ email: email }).first();

    if (check_email != undefined) {
      return res.status(409).json({
        error: true,
        message: "Email already exists",
      });
    }

    const check_phone = await knex(tableName).where({ phone: phone }).first();

    if (check_phone != undefined) {
      return res.status(409).json({
        error: true,
        message: "Phone already exists",
      });
    }

    const InsertSubscriber = await knex(tableName).insert({
      name: name,
      email: email,
      phone: phone,
      address: address,
      plan_id: plan_id,
      status: status,
    });

    if (!InsertSubscriber) {
      return res.status(500).json({
        error: true,
        message: "Can not create Subscriber, Try Again",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Subscriber Created Successfully",
      data: InsertSubscriber,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginateSubscriber = async (req, res) => {
  try {
    const tableName = "subscribers";
    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
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
      message: "retrieved successfully.",
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

const viewSubscriber = async (req, res) => {
  try {

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getSubscriber = await knex("subscribers").select("*").where({ id });

    if (getSubscriber.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Subscriber does not exist.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Subscriber data is found Successfully",
      data: getSubscriber[0],
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const deleteSubscriber = async (req, res) => {
  try {
    const tableName = "subscribers";
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const getSubscriber = await knex("subscribers").select("*").where({ id });

    if (getSubscriber.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Subscriber does not exist.",
      });
    }

    await knex("subscribers").where({ id }).update('isDeleted', 1); 

    return res.status(200).json({
      error: false,
      message: "Subscriber is deleted Successfully",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateSubscriber = async (req, res) => {
  try {
    const tableName = "subscribers";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, name, email, phone, address, plan_id, status } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const check_email = await knex("subscribers")
      .where({ email: email })
      .where("id", "!=", id)
      .first();
    if (check_email != undefined) {
      return res.status(409).json({
        error: true,
        message: "Email already exists",
      });
    }

    const check_phone = await knex("subscribers")
      .where({ phone: phone })
      .where("id", "!=", id)
      .first();
    if (check_phone != undefined) {
      return res.status(409).json({
        error: true,
        message: "Phone already exists",
      });
    }


    const updationDataIs = await functions.takeSnapShot("subscribers",id);

    const updateSubscriber = await knex("subscribers").where({ id }).update({
      name: name,
      email: email,
      phone: phone,
      address: address,
      plan_id: plan_id,
      status: status,
    });

    if (!updateSubscriber) {
      return res.status(500).json({
        error: true,
        message: "Can not update Subscriber, Try Again",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"subscribers","id",id);
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Subscriber Updated Successfully",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "subscribers";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
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
export default {
  createSubscriber,
  paginateSubscriber,
  viewSubscriber,
  deleteSubscriber,
  updateSubscriber,
  delteMultipleRecords
};
