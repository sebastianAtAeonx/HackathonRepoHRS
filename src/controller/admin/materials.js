import knex from "./../../../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import  logs  from "../../middleware/logs.js"
import validation from "../../validation/admin/materials.js";

const createMaterial = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      code,
      name,
      description,
      units,
      material_group,
      subscriber_id,
      status,
    } = value;
    const data = {
      code,
      name,
      description,
      units,
      material_group,
      subscriber_id,
      status,
    };

    const check_subscriber_id = await knex("subscribers").where({
      id: subscriber_id,
    });

    if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "subscriber does not exist",
      });
    }

    // const checkMaterial = await knex("materials")
    //   .where({
    //     name: name,
    //   })
    //   .orWhere({ code: code });
    // if (checkMaterial.length > 0) {
    //   return res.json({
    //     error: true,
    //     message: "Material already exists.",
    //   });
    // }
    const insertMaterial = await knex("materials").insert(data);
    if (!insertMaterial) {
      return res.status(500).json({
        error: true,
        message: "Unable to store the data",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Material data inserted.",
      data: insertMaterial[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
    });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const tableName = "materials";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      id,
      code,
      name,
      description,
      units,
      material_group,
      subscriber_id,
      status,
    } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const data = {
      code,
      name,
      description,
      units,
      material_group,
      subscriber_id,
      status,
    };

    // const check_subscriber_id = await knex("subscribers").where({
    //   id: subscriber_id,
    // });

    // if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
    //  return res.json({
    //     error: true,
    //     message: "subscriber does not exist",
    //   });
    //
    // }
    const check_id = await knex("materials").where({ id: id });
    if (Array.isArray(check_id) && check_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Material id does not exists",
      });
    }
    // const checkMaterial = await knex("materials")
    //   .where({
    //     name: name,
    //   })
    //   .orWhere({ code: code });

    // if (checkMaterial.length > 0) {
    //   return res.json({
    //     error: true,
    //     message: "Material already exists.",
    //   });
    // }

    const updationDataIs = await functions.takeSnapShot("materials",id);

    const updateMaterial = await knex("materials").where({ id }).update(data);
    if (!updateMaterial) {
      return res.status(500).json({
        error: false,
        message: "Data not updated.",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"materials","id",id);
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Material data updated.",
      data: updateMaterial[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data:JSON.stringify(error)
    });
  }
};

const viewMaterial = async (req, res) => {
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

    const result = await knex("materials").select().where({ id });
    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Records not found",
        data: error,
      });
    }
    //
    return res.status(200).json({
      error: false,
      message: "Material found successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data:JSON.stringify(error)
    });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const tableName = "materials";
    const { error, value } = validation.del(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const deleteData = await knex("materials").where({ id }).delete();
    if (deleteData) {
      return res.json({
        message: "Record deleted successfully",
      });
    }
    return res.status(404).json({
      message: "Record not found",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data:JSON.stringify(error)
    });
  }
};

const paginateMaterial = async (req, res) => {
  try {
    const tableName = "materials";
    const searchFrom = ["code", "name", "units"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;

    let results = knex("materials")
      .join("units", "units.unit", "=", "materials.units")
      .join(
        "material_group",
        "material_group.id",
        "=",
        "materials.material_group"
      )
      .select(
        "materials.*",
        "units.name as unit_name",
        "material_group.name as material_group_name"
      );

    if (status != undefined && status != "") {
      results = results.where("materials.status", status);
    }

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(`materials.${element}`, `%${search}%`);
        });
      }
    });

    const total = await results.clone().count("materials.id as total").first();

    let rows = knex("materials")
      .join("units", "units.unit", "=", "materials.units")
      .join(
        "material_group",
        "material_group.id",
        "=",
        "materials.material_group"
      )
      .select(
        "materials.*",
        "units.name as unit_name",
        "material_group.name as material_group_name"
      );

    if (status != undefined && status != "") {
      rows = rows.where("materials.status", status);
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(`materials.${element}`, `%${search}%`);
          });
        });
      }
    });

    rows = await rows
      .orderBy(`materials.${sort}`, order)
      .limit(limit)
      .offset(offset);

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
      message: "Data retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
    });
  }
};
const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "materials";
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
        message: "Something went wrong",
        data: JSON.stringify(error),
      });
    }
}

export default {
  createMaterial,
  updateMaterial,
  viewMaterial,
  deleteMaterial,
  paginateMaterial,
  delteMultipleRecords
};
