import schedule from "node-schedule";
import knex from "../config/mysql_db.js";
import axios from "axios";

const task = async () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  try {
    // Fetch rows that will be updated
    const data = await knex("validateGST_PAN")
      .leftJoin(
        "supplier_details",
        "validateGST_PAN.supplierId",
        "supplier_details.id"
      )
      .select("supplier_details.id", "supplier_details.status")
      .whereNotIn("validateGST_PAN.gstStatus", ["Active", "Valid"])
      .where("validateGST_PAN.gstTime", "<", date);

    if (data.length > 0) {
      const supplierIds = data.map((row) => row.id);

      // Perform the update operation
      await knex("supplier_details")
        .whereIn("id", supplierIds)
        .update({ status: "deactive" });

      // Insert into supplier_status for each affected row
      const supplierStatusData = data.map((row) => ({
        supplier_id: row.id,
        status: row.status,
        Comment: "status changed to deactive using schedule",
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      }));

      await knex("supplier_status").insert(supplierStatusData);

      const invalidPan = await knex("validateGST_PAN")
        .leftJoin(
          "supplier_details",
          "validateGST_PAN.supplierId",
          "supplier_details.id"
        )
        .select("supplier_details.id", "supplier_details.status")
        .whereNot("validateGST_PAN.panStatus", "Valid")
        .where("validateGST_PAN.panTime", "<", date);
    }
  } catch (error) {
    console.error("Error occurred while processing task:", error);
  }
};
// Don't remove this code

// Schedule the task to run on the 1st day of every month.
// const job = schedule.scheduleJob('0 0 1 * *', task);

const callFunction = async (url) => {
  try {
    const response = await axios.post(
      url,
      {}, // Empty request body
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error posting data:", error);
  }
};

const panGstCron = async (time, url) => {
  try {
    const job = schedule.scheduleJob(time, () => callFunction(url));
    const nextRunTime = job.nextInvocation(); // Get the next run time
    return nextRunTime;
  } catch (error) {
    console.log("Cron job failed:", error);
    return null;
  }
};

export default {
  task,
  panGstCron,
};
