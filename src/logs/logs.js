import winston from "winston";
import knex from "../config/mysql_db.js";
import moment from "moment-timezone";

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "user_activity2.log" }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
    winston.format.printf(
      (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
  ),
});

// const logUserActivity = (userId, email, action, description) => {
//   if (action === "Login") {
//     const istTimestamp = new Date().toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//     });
//     logger.info(
//       `[${istTimestamp}]User ${userId} with email ${email} logged in.`
//     );
//     // console.log("this is no log user if con");
//   } else {
//     const istTimestampi = new Date().toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//     });
//     logger.info(
//       `[${istTimestampi}]User ${userId} with email ${email} - ${action}: ${description}`
//     );
//     // console.log("this is in else");
//   }
// };

//store in db
const logUserActivity = async (
  userId,
  email,
  action,
  description,
  method,
  response
) => {
  try {
    // Generate timestamp when the function is called
    const timestamp = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    let method = null;

    // const methodMatch = description.match(/^(GET|POST|PUT|DELETE)\b/);
    // if (methodMatch) {
    //   method = methodMatch[0];
    //   description = description.replace(methodMatch[0], "").trim();
    // }

    description = description.replace(/\bendpoint\b/gi, "").trim();

    // const error = response.error || null;
    // const message = response.message || null;

    // const { error, message } = response

    console.log("this is response", response);
    const activities = {
      action: action,
      method: method,
      description: description,
      response: JSON.stringify(response),
      time: timestamp,
    };

    let existingActivities = [];
    const user = await knex("logs").where({ userId: userId }).first();
    if (user) {
      existingActivities = user.activities ? JSON.parse(user.activities) : [];
    } else {
      // Create a new entry for the user if it doesn't exist
      const firstEntry = await knex("logs").insert({
        userId: userId,
        emailId: email,
        activities: JSON.stringify([activities]),
      });
      console.log("Created first entry for user:", userId);
      return; // Exit the function after creating the first entry
    }

    // Append new activity to existing activities
    existingActivities.push(activities);

    // Update activities in the database
    const updateLogs = await knex("logs")
      .where({ userId: userId })
      .update({ activities: JSON.stringify(existingActivities) });

    console.log("User activity logged successfully");
    console.log("response", response);
  } catch (error) {
    console.error("Error logging user activity:", error);
    // Handle the error appropriately
    throw error;
  }
};

async function logFunction(
  supplierId,
  gstNo,
  panNo,
  supplierName,
  email,
  status,
  onDate,
  byWhom = "-",
  remarks = "-",
  updatedFields = "",
  oldFields = ""
) {
  const data = {
    supplierId: supplierId,
    gstNo: gstNo,
    panNo: panNo,
    supplierName: supplierName,
    email: email,
    status: status,
    onDate: onDate,
    byWhom: byWhom,
    remarks: remarks,
    updatedFields: updatedFields,
    oldFields: oldFields,
  };

  try {
    await knex("supplier_logs").insert(data);
    return true;
  } catch (error) {
    console.error("Error inserting log:", error);
    return false;
  }
}

export default {
  logFunction,
  logUserActivity,
};
