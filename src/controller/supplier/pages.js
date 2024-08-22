import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import validation from "../../validation/supplier/pages.js";

const viewPage = async (req, res) => {
  try {
    const tableName = "pages";
    const tableName2 = "page_group";
    const { error, value } = validation.view(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { pannel_id } = value;
    const result = await knex(tableName).where({ pannel_id: pannel_id });
    const result2 = await knex(tableName2).where({ pannel_id: pannel_id });

    if (result == "" || result2 == "") {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    const mergedobject = [...result, ...result2];
    return res.status(200).json({
      message: "Page view successfull",
      data: mergedobject,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

export default {
  viewPage,
};
