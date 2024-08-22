import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import  logs  from "../../middleware/logs.js"
import validation from "../../validation/admin/country.js";

const viewCountry = async (req, res) => {
  try {
    const tableName = "countries";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({
      id: id,
    }).andWhere({isDeleted:'0'});
    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Country does not exist",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Record retrived successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const paginateCountry = async (req, res) => {
  try {
    const tableName = "countries";
    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status,key } = value;
    let total = 0;
    let results = knex(tableName).andWhere({isDeleted:'0'});
    if (status != undefined && status != "") {
      total = results.where("countries.status", status);
    }
    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    total = await results.count("id as total").first();
    let rows = knex(tableName).andWhere({isDeleted:'0'});

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
    if(key == "All" || key == "all"){
      rows = await rows.orderBy(sort, order)   
    }else{
      rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    }
    
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
      message: "Countries are retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load records.",
      data: JSON.stringify(error),
    });
  }
};

const createCountry = async (req, res) => {
  const tableName = "countries";

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
      country_id,
      capital,
      currency_code,
      domain,
      emoji,
      country_key,
      iso3,
      latitude,
      longitude,
      name,
      native,
      phonecode,
      region,
      subregion,
      status,
    } = value;

    //const id = uuidv4();

    const created_at = knex.fn.now();

    const find_country_key = await knex("countries").where(
      "country_key",
      country_key
    );

    console.log(find_country_key);

    if (find_country_key != 0) {
      return res.status(409).json({
        error: true,
        message: "Country_Key is already exist",
      });
    }

    const insertId = await knex(tableName).insert({
      country_id,
      capital,
      currency_code,
      domain,
      emoji,
      country_key,
      iso3,
      latitude,
      longitude,
      name,
      native,
      phonecode,
      region,
      subregion,
      status,
      created_at,
    });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not create record.",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Country is created successfully",

      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
    });
  }
};

const updateCountry = async (req, res) => {
  try {
    const tableName = "countries";

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
      country_id,
      capital,
      currency_code,
      domain,
      emoji,
      country_key,
      iso3,
      latitude,
      longitude,
      name,
      native,
      phonecode,
      region,
      subregion,
      status,
    } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const updated_at = knex.fn.now();

    const resultx = await knex(tableName)
      .where({ country_key: country_key })
      .where("id", "!=", id);

    if (Array.isArray(resultx) && resultx.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Country Key is alredy exist",
      });
    }
    const updationDataIs = await functions.takeSnapShot(tableName,id);
    const insertId = await knex(tableName)
      .where({ id })
      .andWhere({isDeleted:'0'})
      .update({
        country_id,
        capital,
        currency_code,
        domain,
        emoji,
        country_key,
        iso3,
        latitude,
        longitude,
        name,
        native,
        phonecode,
        region,
        subregion,
        status: status,
        updated_at,
      });

    console.log(insertId);

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Could not update record.",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"countries","id",id);
  }
    return res.status(200).json({
      error: false,
      message: "Country name is updated successfully.",

      data: {
        insertId,
      },
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

const deleteCountry = async (req, res) => {
  try {
    const tableName = "countries";

    const { error, value } = validation.del(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
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

    const check = await knex(tableName).where({ id }).update({isDeleted:1});

    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: " Country is deleted successfully.",
    });
  } catch (error) {
    fun.sendErrorLog(req, error);

    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "countries";
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

const importExcel = async (req, res) => {
  try {
    const tableName = "countries";

    if (!req.files || !req.files.excelfile) {
      return res.status(400).json({
        error: true,
        message: "No file uploaded",
        data: [],
      });
    }

    const headerMappings = {
      capital: "capital",
      "currency code": "currency_code",
      domain: "domain",
      emoji: "emoji",
      "country key": "country_key",
      iso3: "iso3",
      latitude: "latitude",
      longitude: "longitude",
      name: "name",
      native: "native",
      "phone code": "phonecode",
      region: "region",
      "sub region": "subregion",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("country_key")
      .then((rows) =>
        rows.reduce((acc, row) => acc.add(`${row.country_key}`), new Set())
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.country_key}`;
      return !existingEntries.has(entryKey);
    });

    if (dataToInsert.length === 0) {
      return res.json({
        error: true,
        message: "All data from the Excel file already exists.",
      });
    }

    const validData = [];
    const errors = [];

    // Validate each row
    for (const row of dataToInsert) {
      console.log(row);
      if (row.currency_code !== "") {
        const check = await knex("currencies")
          .select("id")
          .where({ code: row.currency_code });
        if (check.length == 0) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Currency not found for row ${row.rowNumber}`,
          });
          continue;
        }
        row.currency_code = check[0].id;
      }   
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
    return res.json({
      error: true,
      message: error.message,
      data: [],
    });
  }
};

export default {
  paginateCountry,
  viewCountry,
  createCountry,
  updateCountry,
  deleteCountry,
  delteMultipleRecords,
  importExcel,
};
