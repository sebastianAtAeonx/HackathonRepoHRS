import Joi from "joi";
import knex from "../../config/mysql_db.js";
import moment from "moment-timezone";
import axios from "axios";
import functions from "../../helpers/functions.js";
import schedule from "../../schedule/schedule.js";
import validation from "../../validation/admin/cronJob.js";

const createCronJob = async (req, res) => {
  try {
    // let schema = Joi.object({
    //   time_unit: Joi.string()
    //     .valid("daily", "hourly", "weekly", "monthly", "yearly")
    //     .required()
    //     .trim(),
    //   day: Joi.string()
    //     .trim()
    //     .allow("")
    //     .when("time_unit", {
    //       is: Joi.valid("weekly"),
    //       then: Joi.required(),
    //     }),
    //   time: Joi.string().trim().allow(""),
    //   date: Joi.date().allow(null),
    //   url: Joi.string()
    //     .required()
    //     .uri()
    //     .regex(/^https?:\/\//),
    // });
    
    let schema = validation.create();
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { time_unit, day, time, url, date } = value;

    schema = schema.fork(["day", "date"], (field) => {
      if (time_unit === "monthly") return field.required();
      if (time_unit === "yearly") return field.required();
      return field;
    });

    schema = schema.fork(["day"], (field) => {
      if (time_unit === "monthly") return field.forbidden();
      if (time_unit === "yearly") return field.forbidden();
      return field;
    });

    schema = schema.fork(["day", "date", "time"], (field) => {
      if (time_unit === "hourly") return field.forbidden();
      return field;
    });

    schema = schema.fork(["time"], (field) => {
      if (time_unit === "daily") return field.required();
      return field;
    });

    schema = schema.fork(["date"], (field) => {
      if (time_unit === "weekly") return field.forbidden();
      return field;
    });

    schema = schema.fork(["day", "time"], (field) => {
      if (time_unit === "weekly") return field.required();
      return field;
    });

    // Validate again with adjusted schema
    const { error: adjustedError, value: adjustedValue } = schema.validate(
      req.body
    );

    if (adjustedError) {
      return res.status(400).json({
        error: true,
        message: adjustedError.details[0].message,
      });
    }

    const {
      day: adjustedDay,
      time: adjustedTime,
      date: adjustedDate,
    } = adjustedValue;

    // Check if URL already exists
    const dbUrl = await knex("cron_jobs")
      .whereRaw("BINARY url = ?", [url])
      .first();

    if (!dbUrl) {
      // URL does not exist, insert a new record
      const insertData = await knex("cron_jobs").insert({
        time_unit,
        time: adjustedTime,
        url,
        day: adjustedDay,
        date: adjustedDate,
      });

      if (!insertData) {
        return res.status(500).json({
          error: true,
          message: "Could not create record.",
        });
      }

      const cronTime = await functions.extractTime(
        time_unit,
        adjustedDay,
        adjustedDate,
        adjustedTime
      );

      try {
        const nextRunTime = await schedule.panGstCron(cronTime, url);
        const formattedNextRunTime = nextRunTime
          ? nextRunTime.toLocaleString("en-IN", {
              timeZone: "Asia/Calcutta",
            })
          : "N/A"; // Format the next run time to a readable string
        return res.status(201).json({
          error: false,
          data: insertData,
          message: `Data inserted successfully.`,
          details: `Next run scheduled for ${formattedNextRunTime}`,
        });
      } catch (error) {
        return res.status(201).json({
          error: false,
          data: insertData,
          message: "Data inserted successfully",
          details: "failed to schedule the next run",
        });
      }
    } else {
      // URL exists, update the record

      const updationDataIs = await functions.takeSnapShot(
        "cron_jobs",
        dbUrl.id
      );

      const updateData = await knex("cron_jobs")
        .where({ id: dbUrl.id })
        .update({
          time_unit,
          time: adjustedTime,
          day: adjustedDay,
          date: adjustedDate,
        });

      if (!updateData) {
        return res.status(500).json({
          error: true,
          message: "Could not update record.",
        });
      }

      if (dbUrl.id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "cron_jobs",
          "id",
          dbUrl.id
        );
      }

      const cronTime = await functions.extractTime(
        time_unit,
        adjustedDay,
        adjustedDate,
        adjustedTime
      );
      try {
        const nextRunTime = await schedule.panGstCron(cronTime, url);
        const formattedNextRunTime = nextRunTime
          ? nextRunTime.toLocaleString("en-IN", {
              timeZone: "Asia/Calcutta",
            })
          : "N/A"; // Format the next run time to a readable string
        return res.json({
          error: false,
          data: updateData,
          message: `Cron jobs updated successfully.`,
          details: `Next run scheduled for ${formattedNextRunTime}`,
        });
      } catch (error) {
        return res.status(200).json({
          error: false,
          data: updateData,
          message: "cron jobs updated successfully",
          details: "failed to schedule the next run",
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      details: error.message,
    });
  }
};

const listCronJob = async (req, res) => {
  try {
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res
        .status(400).json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }

    const { offset, limit, filter } = value;
    let result = knex("cron_jobs");
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const endDate = moment(filter.endDate)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        result = result.whereBetween(dateField, [filter.startDate, endDate]);
      }
    }
    const total = await result.clone().count("id as total").first();
    result = await result.limit(limit).offset(offset);
    // if (result.length === 0) {
    //   return res
    //     .json({
    //       error: true,
    //       message: "No Cron Job found",
    //     })
    //     .end();
    // }
    // Add serial numbers to each cron job
    const serializedResult = result.map((cronJob, index) => ({
      sr_no: offset + index + 1, // Start serial number from 1
      ...cronJob,
    }));

    return res.status(200).json({
      error: false,
      message: "Cron Job retrieved successfully",
      data: {
        rows: serializedResult,
        total: total.total,
      },
    });
  } catch (error) {
    // console.log(error.message);
    return res
      .status(500).json({
        error: true,
        message: "Could not load records.",
      })
      .end();
  }
};

export default {
  createCronJob,
  listCronJob,
};
