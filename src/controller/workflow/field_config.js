import Joi from "joi";
import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/workflow/field_config.js";

const createField = async (req, res) => {
  try {
    const tableName = "fields_config";
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const {
      key,
      module_name,
      group_name,
      required,
      display,
      display_name,
      panel_id,
    } = value;

    // check page id is exists or not
    const panelid = await fun.checkCodeExists("pages", "id", panel_id);
    if (panelid["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "panel does not exist",
      });
    }

    const timestamps = knex.fn.now();

    const insertId = await knex(tableName).insert({
      key,
      module_name,
      group_name,
      required,
      display,
      display_name,
      panel_id,
      department,
      created_at: timestamps,
      updated_at: timestamps,
    });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Added successfully.",
      data: {
        insertId: insertId[0],
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create",
      data: JSON.stringify(error),
    });
  }
};

const updateField = async (req, res) => {
  try {
    const tableName = "fields_config";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, required, display } = value;

    // check field is exists or not
    const fieldId = await fun.checkCodeExists(tableName, "id", id);
    if (fieldId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Field does not exist",
      });
    }

    const timestamps = knex.fn.now();

    const updateField = await knex(tableName)
      .update({
        required,
        display,
        updated_at: timestamps,
      })
      .where({
        id: id,
      });

    if (!updateField) {
      return res.status(500).json({
        error: true,
        message: "Update in the database Failed",
      });
    }
    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(
      req.headers["authorization"],
      "fields_config",
      "id",
      id
    );
    console.log("isUpdated:-", modifiedByTable1);
  }
    return res.status(200).json({
      error: false,
      message: "Updated successfully.",
      data: {
        updatedId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update",
      data: JSON.stringify(error),
    });
  }
};

const updateFieldInternational = async (req, res) => {
  try {
    const tableName = "fields_config";

    const { error, value } = validation.updateFieldInternational(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, required, display } = value;

    // check field is exists or not
    const fieldId = await fun.checkCodeExists(tableName, "id", id);
    if (fieldId["error"] == true) {
      return res.status(404).json({
        error: true,
        message: "Field does not exist",
      });
    }

    const timestamps = knex.fn.now();

    const updateField = await knex(tableName)
      .update({
        international_required:required,
        international_display:display,
        updated_at: timestamps,
      })
      .where({
        id: id,
      });

    if (!updateField) {
      return res.status(500).json({
        error: true,
        message: "Update in the database Failed",
      });
    }
    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(
      req.headers["authorization"],
      "fields_config",
      "id",
      id
    );
    console.log("isUpdated:-", modifiedByTable1);
  }
    return res.status(200).json({
      error: false,
      message: "Updated successfully.",
      data: {
        updatedId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update",
      data: JSON.stringify(error),
    });
  }
};

const listField = async (req, res) => {
  try {
    const tableName = "fields_config";
    const searchFrom = ["subscription_id"];

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
    const total = await results.count("id as total").first();
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
    return res.status(500).json({
      error: true,
      message: "Could not load records",
      data: JSON.stringify(error),
    });
  }
};

const getfields = async (req, res) => {
  try {
    const data = await fun.getFieldConfig("supplier_registration");

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};

const additionalFieldCreate = async (req, res) => {
  try {
    const { error, value } = validation.additionalFieldCreate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const {
      keyname,
      type,
      module_name,
      is_primary,
      display,
      display_name,
      panel_id,
      group_name,
      required,
    } = value;

    const insert = await functions.fieldCreate(
      keyname,
      module_name,
      panel_id,
      group_name,
      type,
      is_primary,
      display,
      display_name,
      required
    );

    if (isNaN(insert)) {
      return res.status(404).json({
        error: true,
        message: insert,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Inserted Successfully",
      data: insert,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create",
      data: JSON.stringify(error),
    });
  }
};

const additionalFieldDelete = async (req, res) => {
  try {
    const { error, value } = validation.additionalFieldDelete(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const deleteResult = await functions.fieldDelete(id);
    console.log("deleteResult:", deleteResult);
    if (!deleteResult) {
      return res.status(500).json({
        error: true,
        message: "Delete in the database Failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Deleted successfully.",
      data: deleteResult,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete",
      data: JSON.stringify(error),
    });
  }
};

const createAdditionalFieldDy = async (req, res) => {
  try {
    const tableName = "supplier_additional_fields";
    const items = req.body;
    const insertParams = {
      TableName: tableName,
      Item: items,
    };

    const result = await functions.insertData(insertParams);
    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Added successfully.",
      data: {
        insertId: result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create",
      data: JSON.stringify(error),
    });
  }
};

const listAdditionalFieldValueDy = async (req, res) => {
  try {
    const tableName = "supplier_additional_fields";
    const result = await functions.getData(tableName);
    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Getting data from the database failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load records",
      data: JSON.stringify(error),
    });
  }
};

const updateAdditionalFieldValueDy = async (req, res) => {};

const deleteAdditionalFieldValueDy = async (req, res) => {
  try {

    const { error, value } = validation.deleteAdditionalFieldValueDy(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, created_at } = value;

    const tableName = "supplier_additional_fields";

    const deleteResult = await functions.deleteData(tableName, id, created_at);

    if (deleteResult !== true) {
      return res.status(500).json({
        error: true,
        message: "Delete in the database Failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted successfully.",
      data: deleteResult,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record",
      data: JSON.stringify(error),
    });
  }
};

const viewAdditionalFieldValueDy = async (req, res) => {
  try {

    const { error, value } = validation.viewAdditionalFieldValueDy(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id, created_at } = value;
    const tableName = "supplier_additional_fields";

    const result = await functions.viewData(tableName, id, created_at);
    if (JSON.stringify(result) === "{}") {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record",
      data: JSON.stringify(error),
    });
  }
};

const getClassifiedFieldList = async (req, res) => {
  try {
    const tableName = "fields_config";
    const getDisplayfields = await knex(tableName).where("display", "1");
    const getRequiredFields = await knex(tableName).where("required", "1");
    const getNotRequiredFields = await knex(tableName).where("required", "0");
    const getNotDisplayFields = await knex(tableName).where("display", "0");

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: {
        displayFields: getDisplayfields,
        requiredFields: getRequiredFields,
        notDisplayFields: getNotDisplayFields,
        notRequiredFields: getNotRequiredFields,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};

const getmodulenames = async (req, res) => {
  try {
    const modulenames = await knex
      .distinct("module_name")
      .from("fields_config")
      .select("module_name");

    console.log(modulenames);

    return res.status(200).json({
      error: false,
      message: "Modules retrived successfully",
      data: modulenames,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not get Module name(s)",
      data: JSON.stringify(error),
    });
  }
};
const getgroupnames = async (req, res) => {
  try {
    const { error, value } = validation.getGroupNames(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { module_name } = value;

    const getGroupNames = await knex
      .distinct("group_name")
      .from("fields_config")
      .where("module_name", module_name)
      .select("group_name");

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: getGroupNames,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};

const getfieldnames = async (req, res) => {
  try {
    const { error, value } = validation.getFieldNames(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { module_name, group_name, offset, limit, sort, order } = value;

    let getFieldNames;
    let totalFields;

    //todo

    if (module_name == "all" && group_name == "all") {
      getFieldNames = knex("fields_config");
      totalFields = knex("fields_config");
    } else {
      getFieldNames = knex("fields_config")
        .where("module_name", module_name)
        .where("group_name", group_name);

      totalFields = knex("fields_config")
        .where("module_name", module_name)
        .where("group_name", group_name);
    }

    totalFields = await totalFields.count("id as count");

    // console.log("TotalFields:", totalFields[0].count);

    getFieldNames = await getFieldNames
      .select(
        "id",
        "key",
        "field_type",
        "required",
        "display_name",
        "panel_id",
        "display"
      )
      .offset(offset)
      // .limit(limit)
      .orderBy(sort, order);
    let srno = 1;
    for (const iterator of getFieldNames) {
      iterator.sr = srno++;
    }

    if (getFieldNames.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No fields found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",

      data: getFieldNames,
      total: totalFields[0].count,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not get field name(s)",
      data: JSON.stringify(error),
    });
  }
};

const getfieldnamesInternational = async (req, res) => {
  try {
    const { error, value } = validation.getfieldnamesInternational(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { module_name, group_name, offset, limit, sort, order } = value;

    let getFieldNames;
    let totalFields;

    //todo

    if (module_name == "all" && group_name == "all") {
      getFieldNames = knex("fields_config");
      totalFields = knex("fields_config");
    } else {
      getFieldNames = knex("fields_config")
        .where("module_name", module_name)
        .where("group_name", group_name);

      totalFields = knex("fields_config")
        .where("module_name", module_name)
        .where("group_name", group_name);
    }

    totalFields = await totalFields.count("id as count");

    // console.log("TotalFields:", totalFields[0].count);

    getFieldNames = await getFieldNames
      .select(
        "id",
        "key",
        "field_type",
        "international_required as required",
        "display_name",
        "panel_id",
        "international_display as display"
      )
      .offset(offset)
      // .limit(limit)
      .orderBy(sort, order);
    let srno = 1;
    for (const iterator of getFieldNames) {
      iterator.sr = srno++;
    }

    if (getFieldNames.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No fields found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",

      data: getFieldNames,
      total: totalFields[0].count,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not get field name(s)",
      data: JSON.stringify(error),
    });
  }
};

// const createAdditionalField = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       subscriber_id: Joi.string().required(),
//       module_name: Joi.string().required(),
//       group_name: Joi.string().required(),
//       panel_id: Joi.string().required(),
//       key: Joi.string().required(),
//       field_type: Joi.string().required(),
//       is_primary: Joi.string().required(),
//       display: Joi.string().required(),
//       required: Joi.string().required(),
//       display_name: Joi.string().required(),
//     });

//     const {
//       error,
//       value
//     } = schema.validate(req.body);

//     if (error) {
//       return res
//         .json({
//           error: true,
//           message: error.details[0].message,
//         })
//
//     }

//     const {
//       subscriber_id,
//       key,
//       field_type,
//       is_primary,
//       display,
//       required,
//       panel_id,
//       display_name,
//       module_name,
//       group_name,
//     } = value;

//     const field_info_value = {
//       key: key,
//       field_type: field_type,
//       display: display,
//       required: required,
//       display_name: display_name,
//       panel_id: panel_id,
//       module_name: module_name,
//       group_name: group_name,
//       is_primary: is_primary,
//     };

//     const field_info = JSON.stringify(field_info_value);

//     const checkSuscriberID = await knex("subscribers")
//       .where({
//         id: subscriber_id,
//       })
//       .first();

//     if (checkSuscriberID == undefined) {
//       return res
//         .json({
//           error: true,
//           message: "Subscriber not found.",
//           data: checkSuscriberID,
//         })
//
//     }

//     const checkRecord = await knex("additional_fields").where({
//       subscriber_id: subscriber_id,
//     });

//     if (checkRecord == undefined) {
//       //insert record
//       const insertRecord = await knex("additional_fields").insert({
//         subscriber_id,
//         field_info,
//       });

//       if (insertRecord.length == 0) {
//         return res
//           .json({
//             error: true,
//             message: "Insertion Failed",
//             data: insertRecord,
//           })
//
//       }

//       return res
//         .json({
//           error: false,
//           message: "Insertion Successful",
//           data: insertRecord,
//         })
//
//     } else {
//       //update record
//       const getFieldData = await knex("additional_fields").where({
//         subscriber_id: subscriber_id
//       }).select("field_info").first()

//       if(!getFieldData){
//         return res.json({
//           error:true,
//           message:"Can not update the record"
//         })

//       }

//       const schema=Joi.object({
//         id:Joi.number().required(),
//         subscriber_id: Joi.string().required(),
//       })

//       const {error,value}=schema.validate(req.body)

//       if(error){
//         return res.json({
//           error:true,
//           message:error.details[0].message
//         })
//       }

//       const {id,subscriber_id}=value

//       const additionalFiledsToAdd={}

//       if(getFieldData[0]===additionalFiledsToAdd){
//         return res.json({message:"can not repeat the filed"}).end()
//       }else{
//         const update=await knex("additional_fields").where({subscriber_id:subscriber_id}).update({
//           additionalFiledsToAdd
//         })

//         if(!update){
//           return res.json({
//             error:true,
//             message:"Can't update the record"
//           })
//         }

//         return res.json({
//           error:false,
//           message:"Record updated successfully",
//           updateId:getFieldData[0].update
//         })

//       }

//     }
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: JSON.stringify(error),
//       })
//
//   }
// };

const createAdditionalField = async (req, res) => {
  try {
    const { subscriber_id, field_info } = req.body;

    const checkSubscriberID = await knex("subscribers")
      .where({
        id: subscriber_id,
      })
      .first();

    if (!checkSubscriberID) {
      return res.status(404).json({
        error: true,
        message: "Subscriber not found.",
        data: checkSubscriberID,
      });
    }

    const existingRecord = await knex("additional_fields")
      .where("subscriber_id", subscriber_id)
      .first();

    if (!existingRecord) {
      await knex("additional_fields").insert({
        subscriber_id,
        field_info: JSON.stringify(field_info),
      });
      return res.status(200).json({ message: "Data inserted successfully" });
    }

    // Merge
    const existingFieldInfo = JSON.parse(existingRecord.field_info);
    const mergedFieldInfo = { ...existingFieldInfo, ...field_info };

    if (JSON.stringify(mergedFieldInfo) !== existingRecord.field_info) {
      await knex("additional_fields")
        .where("subscriber_id", subscriber_id)
        .update({ field_info: JSON.stringify(mergedFieldInfo) });
if(subscriber_id){
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "additional_fields",
        "subscriber_id",
        subscriber_id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
      return res
        .status(200)
        .json({ message: "Field info updated successfully" });
    } else {
      return res
        .status(409)
        .json({ message: "Field info is already up-to-date" });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create field",
      data: JSON.stringify(error),
    });
  }
};

const displayAdditionalField = async (req, res) => {
  try {
    const { error, value } = validation.displayAdditionalField(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const additionalFields = await knex("additional_fields").where({
      id: id,
    });

    if (additionalFields.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No Additional Fields Found",
      });
    }

    const extra = JSON.parse(additionalFields[0].field_info);

    extra.id = additionalFields[0].id;
    extra.subscriber_id = additionalFields[0].subscriber_id;
    extra.status = additionalFields[0].status;
    extra.created_at = additionalFields[0].created_at;
    extra.updated_at = additionalFields[0].updated_at;

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",

      data: extra,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record",
      data: JSON.stringify(error),
    });
  }
};

const listAdditionalField = async (req, res) => {
  try {
    const { error, value } = validation.listAdditionalField(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { subscriber_id } = value;

    const getRecords = await knex("additional_fields").where({
      subscriber_id: subscriber_id,
    });

    if (getRecords.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No Additional Fields Found",
      });
    }
    // Map the records and extract the field_info values outside
    const modifiedRecords = getRecords.map((record) => {
      const { field_info, ...rest } = record;
      const fieldInfoValues = JSON.parse(field_info);
      return {
        ...rest,
        ...fieldInfoValues,
      };
    });

    let sr = 1;
    for (const iterator of modifiedRecords) {
      iterator.sr = sr++;
    }

    const total = getRecords.length;

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: modifiedRecords,
      total: total,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};

const deleteAdditionalField = async (req, res) => {
  try {

    const { error, value } = validation.deleteAdditionalField(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const deleteRecord = await knex("additional_fields").where({
      id: id,
    });

    if (deleteRecord.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No Additional Fields Found",
      });
    }

    const deleteRecord1 = await knex("additional_fields")
      .where({
        id: id,
      })
      .del();

    return res.status(200).json({
      error: false,
      message: "Deleted successfully.",
      data: deleteRecord1,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record",
      data: JSON.stringify(error),
    });
  }
};

const updateAdditionalField = async (req, res) => {
  try {
    const { error, value } = validation.updateAdditionalField(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      id,
      subscriber_id,
      module_name,
      group_name,
      panel_id,
      key,
      field_type,
      is_primary,
      display,
      required,
      display_name,
    } = value;

    const checkRecord = await knex("additional_fields").where({
      id: id,
    });
    if (checkRecord.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No Additional Fields Found",
      });
    }

    const field_info_value = {
      key: key,
      field_type: field_type,
      display: display,
      required: required,
      display_name: display_name,
      panel_id: panel_id,
      module_name: module_name,
      group_name: group_name,
      is_primary: is_primary,
    };

    const field_info = JSON.stringify(field_info_value);

    const updateRecord = await knex("additional_fields")
      .where({
        id: id,
      })
      .update({
        subscriber_id: subscriber_id,
        field_info: field_info,
      });

    if (!updateRecord) {
      return res.status(500).json({
        error: true,
        message: "Update Failed",
        data: updateRecord,
      });
    }
    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(
      req.headers["authorization"],
      "additional_fields",
      "id",
      id
    );
    console.log("isUpdated:-", modifiedByTable1);
  }
    return res.status(200).json({
      error: false,
      message: "Update Successful",
      data: updateRecord,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record",
      data: JSON.stringify(error),
    });
  }
};

export default {
  createField,
  updateField,
  updateFieldInternational,
  listField,
  getfields,
  additionalFieldCreate,
  additionalFieldDelete,
  createAdditionalFieldDy,
  listAdditionalFieldValueDy,
  updateAdditionalFieldValueDy,
  deleteAdditionalFieldValueDy,
  viewAdditionalFieldValueDy,
  getClassifiedFieldList,
  getmodulenames,
  getgroupnames,
  getfieldnames,
  getfieldnamesInternational,
  createAdditionalField,
  displayAdditionalField,
  listAdditionalField,
  deleteAdditionalField,
  updateAdditionalField,
};
