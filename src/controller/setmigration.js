import knex from "knex";
import mysql from "mysql";
import fs from "fs";
import { finished } from "stream/promises";
import { getType } from "pdf-lib";
import chalk from "chalk";
import validation from "../validation/setmigration.js";

var errorlogis = "";
var tablesare = "";

async function checkTableCount(
  hostAddress,
  userName,
  passwordIs,
  databaseName,
  portNo
) {
  // Initialize Knex
  const db = knex({
    client: "mysql",
    connection: {
      host: hostAddress,
      user: userName,
      password: passwordIs,
      database: databaseName,
      port: portNo,
    },
  });

  try {
    // Query to count the number of tables
    const result = await db("information_schema.tables")
      .count("* as tableCount")
      .where("table_schema", databaseName);

    const tableCount = result[0].tableCount;
    return tableCount;
  } catch (err) {
    console.error("Error:", err);
    errorlogis = err;
    return -1;
  } finally {
    await db.destroy();
  }
}
const createandrun = async (req, res) => {
  const { error, value } = validation.create(req.body);

  if (error) {
    return res
      .json({
        error: true,
        message: error.details[0].message,
      })
      .end();
  }

  const {
    hostAddress,
    databaseName,
    userName,
    password,
    portNo = 3306,
  } = value;

  console.log("portNo:", portNo);

  try {
    const knexConfig = {
      client: "mysql",
      connection: {
        host: hostAddress,
        user: userName,
        password: password,
        database: databaseName,
        portNo: portNo,
      },
      migrations: {
        tableName: "knex_migrations",
        directory: "./migrations",
      },
    };

    const checkDB = await checkTableCount(
      hostAddress,
      userName,
      password,
      databaseName,
      portNo
    );

    console.log("checkDB(Tables Found):", checkDB);
    tablesare = checkDB;

    if (checkDB > 2) {
      console.log(
        "DB connection log: Database is connected Successfully and it has already " +
          checkDB +
          " tables"
      );
    }

    console.log("errorlogis: ", String(errorlogis).includes("ECONNREFUSED"));

    if (checkDB === -1) {
      if (
        String(errorlogis).includes("ECONNREFUSED") ||
        String(errorlogis).includes("ENOTFOUND")
      ) {
        return res
          .json({
            error: true,
            message:
              "Database connection failed. Could not connect to host or given port number. Please, recheck your credentials",
          })
          .end();
      }
      return res
        .json({
          error: true,
          message:
            errorlogis +
            " Database connection failed. Please, recheck your given credentials",
        })
        .end();
    }

    const db = knex(knexConfig);
    await db.migrate.latest();
    // await db.seed.run();
    const migrationList = await db.migrate.list();
    const [batchNo, seedFiles] = await db.seed.run();
    await db.destroy();

    let seedFilesLength = 0;
    if (seedFiles !== undefined) {
      seedFilesLength = seedFiles.length;
    }
    console.log(
      "Database connected successfully with " +
        tablesare +
        " table. " +
        (migrationList.length - 2) +
        " latest migrations and " +
        seedFilesLength +
        " seeders has been run successfully."
    );

    //storing values of credentials into .dbCreds
    const writableStream = fs.createWriteStream(".dbCreds");
    writableStream.write('DB="' + databaseName + '"\n');
    writableStream.write('DB_HOST="' + hostAddress + '"\n');
    writableStream.write('DB_USER_NAME="' + userName + '"\n');
    writableStream.write('DB_PASSWORD="' + password + '"\n');
    writableStream.write('DB_PORT="' + portNo + '"\n');

    writableStream.end();
    try {
      finished(writableStream);
    } catch (error) {
      return res.json({
        error: true,
        message: "Tables are generated but, DB Credentials could not wrote",
      });
    }

    return res
      .json({
        error: false,
        message: "Database connected, migrations and seeders run successfully",
        data:
          "Database connected successfully with " +
          tablesare +
          " table. " +
          (migrationList.length - 2) +
          " latest migrations and " +
          seedFilesLength +
          " seeders has been run successfully.",
      })
      .end();
  } catch (error) {
    console.error("Error running migrations:", error);

    return res
      .json({
        error: false,
        message: "Error running migrations:" + error,
      })
      .end();
  }
};

export default {
  createandrun,
};
