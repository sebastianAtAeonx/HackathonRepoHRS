import knex from "../config/mysql_db.js";
import constants from "../helpers/constants.js";
import jwt from "jsonwebtoken";

/**
 * Fetches the old values from the specified table before updating and inserts them into the transaction_logs table.
 *
 * @param {string} tableName - The name of the table to fetch the old values from.
 * @param {number} id - The ID of the record to fetch the old values from.
 * @param {object} updatedValues - The updated values to be inserted into the transaction_logs table.
 * @return {Promise} A promise that resolves when the old values are fetched and inserted successfully, or rejects with an error.
 */
const logOldValues = async (tableName,id, updatedValues,req) => {
  try {
    const token = req.headers["authorization"];
    // if (!token) {
    //   return res.status(400).json({
    //     error: true,
    //     message: "Token is required.",
    //   });
    // }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const userId = payload.id;
    const oldValues = await knex(tableName).where({ id }).first();

    console.log("oldvalues" ,oldValues)
    
    const method = req.method === "PUT" ? "UPDATE" : "DELETE";
    await knex('transaction_logs').insert({
      transaction_type: method,
      table_name: tableName,
      old_value: JSON.stringify(oldValues),
      new_value: JSON.stringify(updatedValues),
      user_id:userId,
      timestamp: knex.fn.now()
    });
  } catch (error) {
    console.error("Error logging old values:", error);
    throw error; 
  }
};

const logForInsert = async (tableName,id, newValues, req) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const userId = payload.id;

    const method = "INSERT";
    await knex('transaction_logs').insert({
      transaction_type: method,
      table_name: tableName,
      new_value: JSON.stringify(newValues),
      user_id: userId,
      timestamp: knex.fn.now()
    });
  } catch (error) {
    console.error("Error logging new values:", error);
    throw error;
  }
};

///for approver
const logOldValuesForApprover = async (tableName,department_id, updatedValues,req) => {
  try {
    const token = req.headers["authorization"];
    // if (!token) {
    //   return res.status(400).json({
    //     error: true,
    //     message: "Token is required.",
    //   });
    // }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const userId = payload.id;
    const oldValues = await knex(tableName).where({ departmentId:department_id }).first();
    
    const method = req.method === "PUT" ? "UPDATE" : "DELETE";
    await knex('transaction_logs').insert({
      transaction_type: method,
      table_name: tableName,
      old_value: JSON.stringify(oldValues),
      new_value: JSON.stringify(updatedValues),
      user_id:userId,
      timestamp: knex.fn.now()
    });
  } catch (error) {
    console.error("Error logging old values:", error);
    throw error; 
  }
};

export default {
  logOldValues,
  logForInsert,
  logOldValuesForApprover
};
