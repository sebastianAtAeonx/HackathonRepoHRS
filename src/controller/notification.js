import knex from "../../src/config/mysql_db.js";
import constants from "../../src/helpers/constants.js";
import jwt from "jsonwebtoken";
import validation from "../../src/validation/notification.js";

const getNotifications = async (req, res) => {
  try {
  const token = req.headers["authorization"];
  if (!token) {
    return res.json({
      error: true,
      message: "Token is required.",
    });
  }

  const { jwtConfig } = constants;
  const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
  const id = payload.id;
  const role = payload.role;

  const { error, value } = validation.paginate(req.body);
  if (error) {
    return res.json({
      error: true,
      message: error.details[0].message,
      data: error,
    });
  }

  let { offset, limit, order, sort, status, filter } = value;

  const notifications = await knex("notification_recipients")
    .where("user_id", id)
    .select("notification_id");

  const ids = [];
  for (const iterator of notifications) {
    ids.push(iterator.notification_id);
  }

  let results = knex("notification").whereIn("id", ids);

  if (filter) {
    const { startDate, endDate, dateField } = filter;
    if (startDate && endDate && dateField) {
      const startDateISO = new Date(startDate).toISOString();
      const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();

      if (dateField === "created_at") {
        results.whereBetween("created_at", [startDateISO, endDateISO]);
      } else if (dateField === "updated_at") {
        results.whereBetween("updated_at", [startDateISO, endDateISO]);
      }
    }
  }

  if (status) {
    results.where("read", status);
  }

  const unread = await results
    .clone()
    .where("read", "0")
    .count("id as total")
    .first();
  const total = await results.clone().count("id as total").first();

  results = results
    .orderBy([
      { column: sort, order: "desc" },
      { column: "id", order: order },
    ])
    .limit(limit)
    .offset(offset);

  let data_rows = await results;

  let sr = offset + 1;
  data_rows = await Promise.all(
    data_rows.map(async (row) => {
      row.sr = order === "desc" ? sr++ : total.total - limit * offset--;
      return row;
    })
  );

  
  return res.status(200).json({
    error: false,
    message: "Retrieved successfully.",
    data:data_rows,
    unread: unread.total ,
    total: total.total,
  });

  } catch (error) {
    return res.json({
      error: true,
      message: error.message != "" ? error.message : "Something went wrong",
    });
  }
};

const createNotification = async (user_id, heading, message, read) => {
  try {
    const { error, value } = validation.create({
      user_id,
      heading,
      message,
      read,
    });
    if (error) {
      return {
        error: true,
        message: error.details[0].message,
      };
    }

    const createNotification = await knex("notification").insert({
      heading,
      message,
      read,
    });
    if (createNotification == 0) {
      return {
        error: true,
        message: "Notification not created",
      };
    }
    const failedToInsertNotification = [];
    for (const iterator of user_id) {
      const checkUser = await knex("users").where("id", iterator);
      if (checkUser.length == 0) {
        failedToInsertNotification.push(iterator);
        continue;
      }

      const insertRecepients = await knex("notification_recipients").insert({
        notification_id: createNotification,
        user_id: iterator,
      });
      if (insertRecepients == 0) {
        failedToInsertNotification.push(iterator);
        continue;
      }
    }

    return {
      error: false,
      message: "Notification created",
      data: failedToInsertNotification,
    };
  } catch (error) {
    return {
      error: true,
      message: error.message != "" ? error.message : "Something went wrong",
    };
  }
};

const readNotification = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    const readNotification = await knex("notification")
      .where("id", id)
      .update({ read: "1" });
    if (readNotification == 0) {
      return res.json({
        error: true,
        message: "Notification not read",
      });
    }
    return res.json({
      error: false,
      message: "Notification read",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message != "" ? error.message : "Something went wrong",
    });
  }
};

const readAllNotification = async (req, res) => {
  try {
    const { error, value } = validation.readAll(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { ids } = value;
    const readNotification = await knex("notification")
      .whereIn("id", ids)
      .update({ read: "1" });
    if (readNotification == 0) {
      return res.json({
        error: true,
        message: "Notification not read",
      });
    }
    return res.json({
      error: false,
      message: "Notifications read",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message != "" ? error.message : "Something went wrong",
    });
  }
};

export default {
  getNotifications,
  createNotification,
  readNotification,
  readAllNotification,
};
