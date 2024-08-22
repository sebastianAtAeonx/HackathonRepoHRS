import Joi from "joi";
import knex from "../../config/mysql_db.js";
import logs from "../../middleware/logs.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/supplier/materials.js";

const createMaterial = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      code,
      name,
      hsnCode,
      price,
      tax,
      plants,
      description,
      unit_id,
      material_group_id,
      storage_locations,
      material_type_id,
    } = value;

    const data = {
      code,
      name,
      hsnCode,
      price,
      tax,
      plants: JSON.stringify(plants),
      description,
      unit_id,
      material_group_id,
      storage_locations: JSON.stringify(storage_locations),
      material_type_id,
    };

    const checkExistanceData = await knex("materials")
      .select()
      .where({ code: code })
      .andWhere({isDeleted:'0'});

    if (checkExistanceData.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Material already exists with given Code",
        data: error,
      });
    }
    if (unit_id) {
      const checkUom = await knex("units").select().where({ id: unit_id });
      if (checkUom.length == 0) {
        return res.json({
          error: true,
          message: "Unit not found",
        });
      }
    }
    if (material_group_id) {
      const checkMaterialGroup = await knex("material_group")
        .select()
        .where({ id: material_group_id });
      if (checkMaterialGroup.length == 0) {
        return res.json({
          error: true,
          message: "Material Group not found",
        });
      }
    }
    if (material_type_id) {
      const checkMaterialType = await knex("material_type")
        .select()
        .where({ id: material_type_id });
      if (checkMaterialType.length == 0) {
        return res.json({
          error: true,
          message: "Material Type not found",
        });
      }
    }
    const insertData = await knex("materials").insert(data);

    if (!insertData) {
      return res.status(500).json({
        error: true,
        message: "Could not create Material",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Material Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Material.",
      data: error.message,
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
        data: error,
      });
    }

    const {
      id,
      code,
      name,
      hsnCode,
      price,
      tax,
      plants,
      description,
      unit_id,
      material_group_id,
      storage_locations,
      material_type_id,
    } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const data = {
      code,
      name,
      hsnCode,
      price,
      tax,
      plants: JSON.stringify(plants),
      description,
      unit_id,
      material_group_id,
      storage_locations: JSON.stringify(storage_locations),
      material_type_id,
    };

    const checkExistanceData = await knex("materials")
      .select()
      .where({ id: id })
      .first();

    if (checkExistanceData == undefined) {
      return res.status(404).json({
        error: true,
        message: "Material not found",
      });
    }

    const checkCode = await knex("materials")
      .select()
      .where("id", "!=", id)
      .where("code", code)
      .whereNot("isDeleted",1);

    if (checkCode.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Material already exists with given Code",
      });
    }

    if (unit_id) {
      const checkUom = await knex("units").select().where({ id: unit_id });
      if (checkUom.length == 0) {
        return res.status(404).json({
          error: true,
          message: "Unit not found",
        });
      }
    }
    if (material_group_id) {
      const checkMaterialGroup = await knex("material_group")
        .select()
        .where({ id: material_group_id });
      if (checkMaterialGroup.length == 0) {
        return res.status(404).json({
          error: true,
          message: "Material Group not found",
        });
      }
    }
    if (material_type_id) {
      const checkMaterialType = await knex("material_type")
        .select()
        .where({ id: material_type_id });
      if (checkMaterialType.length == 0) {
        return res.status(404).json({
          error: true,
          message: "Material Type not found",
        });
      }
    }
    const updateData = await knex("materials").where({ id: id }).update(data);

    if (!updateData) {
      return res.status(500).json({
        error: true,
        message: "Could not update Material",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "materials",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Material Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update Material.",
      data: JSON.stringify(error),
    });
  }
};

const viewMaterial = async (req, res) => {
  try {
    const tableName = "materials";
    const units = "units";
    const material_type = "material_type";
    const material_group = "material_group";

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
      .leftJoin(`${units}`, `${tableName}.unit_id`, `${units}.id`)
      .select(
        `${tableName}.*`,
        `${units}.name as unit`,
        `${material_type}.name as material_type`,
        `${material_group}.name as material_group`
      )
      .leftJoin(
        `${material_type}`,
        `${tableName}.material_type_id`,
        `${material_type}.id`
      )
      .leftJoin(
        `${material_group}`,
        `${tableName}.material_group_id`,
        `${material_group}.id`
      )
      .where({ [`${tableName}.id`]: id });

    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Material not found",
        data: error,
      });
    }

    result[0].plants = JSON.parse(result[0].plants);
    result[0].storage_locations = JSON.parse(result[0].storage_locations);
    //
    return res.status(200).json({
      error: false,
      message: "Material found successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Material.",
      data: JSON.stringify(error),
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

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const deleteData = await knex("materials")
      .where({ id })
      .update("isDeleted", 1);
    if (deleteData) {
      return res.status(200).json({
        message: "Material deleted successfully",
      });
    }
    return res.status(404).json({
      message: "Material not found",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Material.",
      data: JSON.stringify(error),
    });
  }
};

const paginateMaterial = async (req, res) => {
  try {
    const tableName = "materials";
    const units = "units";
    const material_type = "material_type";
    const material_group = "material_group";
    const searchFrom = ["name", "description", "code"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status, dropDown } = value;

    // Filter records where isDeleted: 1
    let rows = knex(tableName)
      .where(`${tableName}.isDeleted`, '0')  
      .leftJoin(`${units}`, `${tableName}.unit_id`, `${units}.id`)
      .select(
        `${tableName}.*`,
        `${units}.name as unit`,
        `${material_type}.name as material_type`,
        `${material_group}.name as material_group`
      )
      .leftJoin(
        `${material_type}`,
        `${tableName}.material_type_id`,
        `${material_type}.id`
      )
      .leftJoin(
        `${material_group}`,
        `${tableName}.material_group_id`,
        `${material_group}.id`
      );

    // Apply status filter if provided
    if (status !== "") {
      rows = rows.where(`${tableName}.status`, status);
    }

    // Apply search filter if provided
    if (search) {
      rows = rows.where(function () {
        searchFrom.forEach((element) => {
          this.orWhereILike(`${tableName}.${element}`, `%${search}%`);
        });
      });
    }

    // Get total count
    const total = await rows.clone().count(`${tableName}.id as total`).first();

    // Apply sorting, pagination and fetch rows
    if (dropDown == "0") {
      rows = await rows.orderBy(sort, order);
    } else {
      rows = await rows
        .orderBy(`${tableName}.${sort}`, order)
        .limit(limit)
        .offset(offset);
    }

    // Prepare data with serial numbers
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        console.log(row)
        row.plants = row.plants != undefined && row.plants != ""?JSON.parse(row.plants):row.plants;
        row.storage_locations = row.storage_locations != undefined && row.storage_locations != "" ? JSON.parse(row.storage_locations):row.storage_locations;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        row.plants = JSON.parse(row.plants);
        row.storage_locations = JSON.parse(row.storage_locations);
        data_rows.push(row);
        sr--;
      });
    }

    return res.status(200).json({
      error: false,
      message: "Material retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Material.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "materials";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Materials",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Materials successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Material.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "materials";

    if (!req.files || !req.files.excelfile) {
      return res.status(400).json({
        error: true,
        message: "No file uploaded",
        data: [],
      });
    }

    const headerMappings = {
      code: "code",
      name: "name",
      "hsn code": "hsnCode",
      price: "price",
      tax: "tax",
      plants: "plants",
      description: "description",
      unit: "unit_id",
      "material group": "material_group_id",
      "storage locations": "storage_locations",
      "material type": "material_type_id",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("code", "name")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.code}-${row.name}`), new Set())
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.code}-${rowData.name}`;
      return !existingEntries.has(entryKey);
    });

    if (dataToInsert.length === 0) {
      return res.status(409).json({
        error: true,
        message: "All data from the Excel file already exists.",
      });
    }

    const validData = [];
    const errors = [];

    // Validate each row
    for (const row of dataToInsert) {
      row.hsnCode = row.hsncode;
      delete row.hsncode;

      if (row.plants) {
        row.plants = row.plants
          .split(",")
          .map((plant) => ({ plant: plant.trim() }));
        row.plants = JSON.stringify(row.plants);
      }
      if (row.storage_locations) {
        row.storage_locations = row.storage_locations
          .split(",")
          .map((storage_location) => ({
            storage_location: storage_location.trim(),
          }));
        row.storage_locations = JSON.stringify(row.storage_locations);
      }

      if (row.unit_id !== "") {
        const check = await knex("units")
          .select("id")
          .where({ unit: row.unit_id });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Unit not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.unit_id = check[0].id;
      }

      if (row.material_group_id !== "") {
        const check = await knex("material_group")
          .select("id")
          .where({ name: row.material_group_id });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Material Group Not Found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.material_group_id = check[0].id;
      }

      if (row.material_type_id !== "") {
        const check = await knex("material_type")
          .select("id")
          .where({ name: row.material_type_id });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Material type not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.material_type_id = check[0].id;
      }

      console.log(row);

      // Validate the row using the schema
      const { error } = validation.importExcel(row);
      if (error) {
        errors.push({
          rowNumber: row.rowNumber,
          message: `Validation error in row ${row.rowNumber}: ${error.details[0].message}`,
        });
      } else {
        validData.push(row);
      }
    }

    if (validData.length > 0) {
      // Remove rowNumber before inserting
      const Data = validData.map(({ rowNumber, ...rest }) => rest);
      await knex.transaction(async (trx) => {
        await trx(tableName).insert(Data);
      });
    }

    const responseMessage =
      validData.length === dataToInsert.length
        ? "Data inserted successfully"
        : "Some records were not inserted due to validation errors.";
    return res.json({
      error: validData.length === 0,
      message: responseMessage,
      errors: errors.length > 0 ? errors : [],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
      data: [],
    });
  }
};

export default {
  createMaterial,
  updateMaterial,
  viewMaterial,
  deleteMaterial,
  paginateMaterial,
  delteMultipleRecords,
  importExcel,
};
