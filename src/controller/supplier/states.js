import knex from "../../config/mysql_db.js";
import validation from "../../validation/supplier/states.js";

const viewState = async (req, res) => {
  try {
    const { error, value } = validation.view(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: "Field error",
        data: error,
      });
    }

    const { countryKey } = value;

    const result = await knex("states")
      .where({ countryKey: countryKey })
      .select("stateDesc", "countryDesc", "id");

    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Unable to find details",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Data is here",
      data: result,
      total: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

export default { viewState };
