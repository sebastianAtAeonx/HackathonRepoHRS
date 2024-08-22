import knex from "../../config/mysql_db.js";
import logs from "../../middleware/logs.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/supplier/materialGroup.js";

const createMaterial_group = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { name, description } = value;

    const data = {
      name,
      description,
    };

    // const check_subscriber_id = await knex("subscribers").where({
    //     id: subscriber_id,
    //   });

    //   if (Array.isArray(check_subscriber_id) && check_subscriber_id.length <= 0) {
    //    return res.json({
    //       error: true,
    //       message: "subscriber does not exist",
    //     });
    //
    //   }
    // const created_at = knex.fn.now();
    // const updated_at = knex.fn.now();

    const check_data = await knex("material_group")
      .where({
        name: name,
      })
      .whereNot({ isDeleted: 1 });

    if (check_data.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Material Group is alredy exist",
      });
    }

    const insert_material_group = await knex("material_group").insert({
      name,
      description,
    });
    if (!insert_material_group) {
      return res.status(500).json({
        error: true,
        message: "Unable to create Material Group",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Material Group created successfully",
      data: insert_material_group[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create Material Group.",
      data: JSON.stringify(error),
    });
  }
};

const updateMaterial_group = async (req, res) => {
  try {
    const tableName = "material_group";

    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id, name, description, status } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const data = {
      name,
      description,
      status,
    };
    const check_id = await knex("material_group").where({
      id: id,
    });

    if (Array.isArray(check_id) && check_id.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Material group does not exist",
      });
    }

    const checkMaterial_data = await knex("material_group")
      .select("*")
      .where("id", "!=", id)
      .where({ name: name })
      .whereNot("isDeleted",1);

    if (checkMaterial_data.length > 0) {
      return res.status(409).json({
        error: true,
        message: " Material_group already exists.",
      });
    }

    const updateTypeOfMaterial = await knex("material_group")
      .where({ id })
      .update(data);
    if (!updateTypeOfMaterial) {
      return res.status(500).json({
        error: false,
        message: "Could not update material group",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "material_group",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Material Group updated.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update Material Group.",
      data: JSON.stringify(error),
    });
  }
};

const viewMaterialGroup = async (req, res) => {
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

    const result = await knex("material_group").select().where({ id });
    if (result.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Data not found",
        data: error,
      });
    }
    //   delete result[0].updated_at;
    //   delete result[0].created_at;

    return res.status(200).json({
      error: false,
      message: "Material Group retrived successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Material Group.",
      data: JSON.stringify(error),
    });
  }
};

const deleteMaterialGroup = async (req, res) => {
  try {
    const tableName = "material_group";

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

    const delete_pg = await knex("material_group")
      .where({ id })
      .update({ isDeleted: 1 });
    if (delete_pg) {
      return res.status(200).json({
        error: false,
        message: "Material Group deleted successfully",
      });
    } else {
      return res.status(500).json({
        error: true,
        message: "Material Group could not delete",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Material Group.",
      data: JSON.stringify(error),
    });
  }
};

const paginateMaterialGroup = async (req, res) => {
  try {
    const tableName = "material_group";
    const searchFrom = ["name", "description"];

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
    let results = knex(tableName).andWhere({isDeleted:'0'});

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

    let rows = knex(tableName).andWhere({isDeleted:'0'});
    if (status != undefined && status != "") {
      rows.where("status", status);
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(element, `%${search}%`);
          });
        });
      }
    });

    //updated code
    // if (search != undefined && search != "") {
    //   rows.where(function () {
    //     searchFrom.forEach((element, index) => {
    //       if (index > 0) {
    //         this.orWhere(function () {
    //           this.orWhereILike(element, `%${search}%`);
    //         });
    //       }
    //       this.orWhereILike(element, `%${search}%`);
    //     });
    //   });
    // }
    console.log("hello", rows.toString());
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    let data_rows = [];
    console.log(data_rows);
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
      message: "Material Group retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch Material Group.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "material_group";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more Material Group",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected Material Groups successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete Material Group.",
      data: JSON.stringify(error),
    });
  }
};

const importExcel = async (req, res) => {
  try {
    const tableName = "material_group";

    if (!req.files.excelfile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headerMappings = {
      name: "name",
      description: "description",
    };

    const { header, data } = await functions.readExcelData(
      req.files.excelfile.data,
      headerMappings
    );
    const existingEntries = await knex(tableName)
      .select("name", "description")
      .then((rows) =>
        rows.reduce(
          (acc, row) => acc.add(`${row.name}-${row.description}`),
          new Set()
        )
      );

    const dataToInsert = data.filter((rowData) => {
      const entryKey = `${rowData.name}-${rowData.description}`;
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
  createMaterial_group,
  updateMaterial_group,
  viewMaterialGroup,
  deleteMaterialGroup,
  paginateMaterialGroup,
  delteMultipleRecords,
  importExcel,
};
