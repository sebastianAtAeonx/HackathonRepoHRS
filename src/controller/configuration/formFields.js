import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/configuration/formFields.js";

const create = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });
    }

    const { moduleName, status, fields } = value;

    const cTime = new Date().toISOString().slice(0, 19).replace("T", " ");

    fields[0].createdAt = cTime;
    fields[0].updatedAt = null;

    const checkModule = await knex("form_field_configuration")
      .where({
        moduleName: moduleName,
      })
      .first();

    if (checkModule == undefined) {
      //insert
      const insertData = await knex("form_field_configuration").insert({
        moduleName: moduleName,
        status: status,
        fields: JSON.stringify(fields),
      });
      return res
        .status(200)
        .json({ error: false, message: "Key inserted successfully" });
    } else {
      //update
      const existingFields = JSON.parse(checkModule.fields);

      const currentKey = fields[0].key;

      const existingKeys = [];

      for (const iterator of existingFields) {
        existingKeys.push(iterator.key);
      }

      console.log("existingkeys", existingKeys);

      if (existingKeys.includes(currentKey)) {
        return res
          .status(400)
          .json({ error: true, message: "Key already exists" });
      } else {
        //update
        existingFields.push(fields[0]);
        console.log(existingFields);

        const getIdIs = await knex("form_field_configuration")
          .where({
            moduleName: moduleName,
          })
          .first();

        const updationDataIs = await functions.takeSnapShot(
          "form_field_configuration",
          getIdIs.id
        );

        const updateData = await knex("form_field_configuration")
          .where({
            moduleName: moduleName,
          })
          .update({
            fields: JSON.stringify(existingFields),
          });

        if (updateData) {
          if (moduleName) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "form_field_configuration",
              "moduleName",
              moduleName
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
        }

        return res
          .status(200)
          .json({ error: false, message: "New key added successfully" });
      }
    }
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
};

function getPosition(array, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === value) {
      return i; // Return the index of the value if found
    }
  }
  return -1; // Return -1 if the value is not found in the array
}

const update = async (req, res) => {
  const { error, value } = validation.update(req.body);
  if (error) {
    return res
      .status(400)
      .json({ error: true, message: error.details[0].message });
  }

  const { moduleName, status, fields } = value;
  const cTime = new Date().toISOString().slice(0, 19).replace("T", " ");

  fields[0].createdAt = cTime;
  fields[0].updatedAt = cTime;

  const checkModule = await knex("form_field_configuration")
    .where({
      moduleName: moduleName,
    })
    .first();

  if (checkModule == undefined) {
    return res.status(400).json({ error: true, message: "module not found" });
  } else {
    //update key and it's value code goes here...
    const currentKey = fields[0].key;
    const existingFields = JSON.parse(checkModule.fields);
    const existingKeys = [];
    for (const iterator of existingFields) {
      existingKeys.push(iterator.key);
    }
    console.log(existingKeys);
    const position = getPosition(existingKeys, fields[0].key);

    if (position >= 0) {
      const createdAt = existingFields[position].createdAt;
      fields[0].createdAt = createdAt;
      existingFields[position] = fields[0];
      console.log("result:=", existingFields);

      const getIdIs = await knex("form_field_configuration")
        .where({
          moduleName: moduleName,
        })
        .first();

      const updationDataIs = await functions.takeSnapShot(
        "form_field_configuration",
        getIdIs.id
      );

      const updateData = await knex("form_field_configuration")
        .where({
          moduleName: moduleName,
        })
        .update({
          fields: JSON.stringify(existingFields),
        });

      if (moduleName) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "form_field_configuration",
          "moduleName",
          moduleName
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
      return res
        .status(200)
        .json({ error: false, message: "field updated successfully" });
    } else {
      return res.status(400).json({ error: true, message: "key not found" });
    }
    return res
      .status(200)
      .json({ error: false, message: "field updated successfully" });
  }
};

const list = async (req, res) => {
  const getData = await knex("form_field_configuration").select();
  getData.map((data) => {
    data.fields = JSON.parse(data.fields);
  });
  return res.status(200).json({ error: false, data: getData });
};

const view = async (req, res) => {
  const { error, value } = validation.view(req.body);
  if (error) {
    return res
      .status(400)
      .json({ error: true, message: error.details[0].message });
  }

  const { moduleName, key } = value;
  const getData = await knex("form_field_configuration")
    .where({
      moduleName: moduleName,
    })
    .first();
  if (getData == undefined) {
    return res.status(400).json({ error: true, message: "module not found" });
  }
  const fields = JSON.parse(getData.fields);
  // const existingKeys = [];
  // for (const iterator of fields) {
  //   existingKeys.push(iterator.key);
  // }

  // if (existingKeys.includes(key) == false) {
  //   return res.status(400).json({ error: true, message: "key not found" });
  // }

  // const position = getPosition(existingKeys, key);

  return res.status(200).json({
    error: false,
    message: "key retrived successfully",
    data: fields,
  });
};

const remove = async (req, res) => {
  const { error, value } = validation.del(req.body);
  if (error) {
    return res
      .status(400)
      .json({ error: true, message: error.details[0].message });
  }

  const { moduleName, key } = value;
  const getData = await knex("form_field_configuration")
    .where({
      moduleName: moduleName,
    })
    .first();
  if (getData == undefined) {
    return res.status(400).json({ error: true, message: "module not found" });
  }
  const fields = JSON.parse(getData.fields);
  const existingKeys = [];
  for (const iterator of fields) {
    existingKeys.push(iterator.key);
  }

  if (existingKeys.includes(key) == false) {
    return res.status(400).json({ error: true, message: "key not found" });
  }

  const position = getPosition(existingKeys, key);

  fields.splice(position, 1);

  console.log("fields are:=", fields);

  //update json

  const getIdis = await knex("form_field_configuration")
    .where({
      moduleName: moduleName,
    })
    .select("id")
    .first();

  const updationDataIs = await functions.takeSnapShot(
    "form_field_configuration",
    getIdis.id
  );

  const updateData = await knex("form_field_configuration")
    .where({
      moduleName: moduleName,
    })
    .update({
      fields: JSON.stringify(fields),
    });

  if (updateData) {
    if (moduleName) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "form_field_configuration",
        "moduleName",
        moduleName
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
  }

  return res.status(200).json({
    error: false,
    message: "key deleted successfully",
  });
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "form_field_configuration";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

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
  create,
  update,
  list,
  view,
  remove,
  delteMultipleRecords,
};
