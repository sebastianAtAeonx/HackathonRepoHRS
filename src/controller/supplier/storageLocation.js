import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/storageLocation.js";

const createStorageLocation = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { code, name, plantId, description, status } = value;

    // const check_subscriber_id = await knex("subscribers").where({
    //   id: subscriber_id,
    // });

    // if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
    //   return res.json({
    //     error: true,
    //     message: "subscriber does not exist",
    //   });
    // }

    const checkPlant = await knex("plants").where({
      id: plantId,
    });

    if (checkPlant.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Plant does not exist",
      });
    }

    const check_code = await knex("storage_locations").where({ code }).andWhere({isDeleted:'0'});
    if (check_code.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Storage Location code already exist",
      });
    }

    const check_name = await knex("storage_locations").where({ name }).andWhere({isDeleted:'0'});
    if (check_name.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Storage Location name already exist",
      });
    }

    const insertInStorageLocation = await knex("storage_locations").insert({
      plantId,
      code,
      name,
      description,
      status,
    });

    if (!insertInStorageLocation) {
      return res.status(500).json({
        error: true,
        message: "Unable to create storage location",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Storage Location created successfully",
      id: insertInStorageLocation[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Storage Location.",
    });
  }
};

const viewStorageLocation = async (req, res) => {
  try {
    const tableName = "storage_locations";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({
      id,
    }).andWhere({isDeleted:'0'});
    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Storage Location not found",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Storage Location found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Storage Location.",
    });
  }
};

const updateStorageLocation = async (req, res) => {
  try {

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, plantId, code, name, description, status } = value;

    const tableName = "storage_locations";
    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check_id = await knex("storage_locations").where({
      id: id,
    }).andWhere({isDeleted:'0'});
    if (Array.isArray(check_id) && check_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Storage Location does not exist",
      });
    }

    const check_code = await knex("storage_locations")
      .where({ code })
      .whereNot({ id })
      .whereNot({isDeleted:1});
    if (Array.isArray(check_code) && check_code.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Storage Location Code already exist",
      });
    }

    const check_name = await knex("storage_locations")
      .where({ name })
      .whereNot({ id })
      .whereNot({isDeleted:1});
    if (Array.isArray(check_name) && check_name.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Storage Location Name already exist",
      });
    }

    const updated_at = knex.fn.now();

    const updationDataIs = await functions.takeSnapShot(
      "storage_locations",
      id
    );

    const updateIStorageLocation = await knex("storage_locations")
      .where("id", id)
      .update({
        code,
        name,
        description,
        status,
        updated_at,
      });

    if (!updateIStorageLocation) {
      return res.status(500).json({
        error: true,
        message: "Unable to update Storage Location.",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "storage_locations",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Storage Location updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteStorageLocation = async (req, res) => {
  try {
    const tableName = "storage_locations";

    const { error, value } = validation.del(req.params);
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
    const check = await knex(tableName)
      .where({
        id: id,
      })
      .update('isDeleted', '1'); 
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Storage Location deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Storage Location.",
      data: JSON.stringify(error),
    });
  }
};

const paginateStorageLocation = async (req, res) => {
  try {
    const tableName = "storage_locations";
    const searchFrom = [
      "storage_locations.code",
      "storage_locations.name",
      "storage_locations.description",
    ];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status, plantId } = value;

    // Base query for filtering
    let query = knex(tableName)
      .where(`${tableName}.isDeleted`, '0')
      .leftJoin("plants", `${tableName}.plantId`, "plants.id")
      .select(`${tableName}.*`, "plants.name AS plantName");

    // Apply plantId filter if provided
    if (plantId) {
      query = query.where(`${tableName}.plantId`, plantId);
    }

    // Apply status filter if provided
    if (status !== "") {
      query = query.where(`${tableName}.status`, status);
    }

    // Apply search filter if provided
    if (search) {
      query = query.andWhere(function () {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      });
    }

    // Get total count before pagination
    const total = await query.clone().count(`${tableName}.id as total`).first();

    // Apply sorting and pagination
    query = query.orderBy(`${tableName}.${sort}`, order).limit(limit).offset(offset);

    // Execute the query to get the rows
    const rows = await query;

    // Add serial numbers to the rows
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr--;
      });
    }

    // Return the final response
    return res.status(200).json({
      error: false,
      message: "Storage Location retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Storage Location.",
      data: JSON.stringify(error),
    });
  }
};


const storageLocation = async (req, res) => {
  try {
    const { error, value } = validation.storageLocation(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      plantId,
      storageLocationCode,
      storageLocationName,
      storageLocationDesc,
    } = value;

    const plant = await knex("plants").where({ id: plantId }).first();

    if (!plant) {
      return res
        .status(404)
        .json({
          error: true,
          message: "Plant does not exist",
        })
        .end();
    }

    const existingStorageLocation = await knex("storage_locations")
      .where({ code: storageLocationCode })
      .first();

    if (existingStorageLocation) {
      return res
        .status(409)
        .json({
          error: true,
          message: "Storage location code already exists",
        })
        .end();
    }

    const [insertedId] = await knex("storage_locations").insert({
      plantId: plantId,
      name: storageLocationName,
      code: storageLocationCode,
      description: storageLocationDesc,
    });

    if (!insertedId) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Unable to create Storage Location",
        })
        .end();
    }

    const insertedData = await knex("storage_locations")
      .where({ id: insertedId })
      .first();

    return res.status(200).json({
      error: false,
      message: "Storage location code inserted successfully",
      data: insertedData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not create Storage Location.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "storage_locations";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Storage Locations",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Storage Locations successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Storage Location.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "storage_locations";

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
      "plant code": "plantId",
      description: "description",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("code")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.code}`), new Set())
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.code}`;
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
      row.plantId = row.plantid;
      delete row.plantid;
      if (row.plantId !== "") {
        const check = await knex("plants")
          .select("id")
          .where({ code: row.plantId });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Plant not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.plantId = check[0].id;
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
    return res.status(200).json({
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
  createStorageLocation,
  updateStorageLocation,
  viewStorageLocation,
  deleteStorageLocation,
  paginateStorageLocation,
  storageLocation,
  delteMultipleRecords,
  importExcel,
};
