import knex from "knex";
import dotenv from "dotenv";
dotenv.config({ silent: process.env.NODE_ENV === "production" });

let dbconfig = {
  host: "localhost",
  user: "root",
  port: "3306",
  password: "",
  database: "supplierx_dev",
};

const mode = process.env.DB_ENVIRONMENT; // dev,pro

if (mode === "pro") {
  dbconfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
  };
}

const knexConfig = {
  client: "mysql",
  connection: {
    ...dbconfig,
  },
};

const db = knex(knexConfig);

export const databaseName = dbconfig.database;

export default db;


// import config from "../helpers/constants.js";
// import knex from "knex";
// import dotenv from "dotenv";
// dotenv.config({ silent: process.env.NODE_ENV === "production" });

// let dbconfig = {
//   host: "localhost",
//   user: "root",
//   port: "3306",
//   password: "",
//   database: "supplierx",
// };
// const mode = process.env.DB_ENVIRONMENT; // dev,pro

// if (mode == "pro") {
//   dbconfig = {
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER_NAME,
//     port: process.env.DB_PORT,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB,
//   };
// }


// export default knex({
//   client: "mysql",
//   connection: {
//     ...dbconfig
//     // host: config.dbconfig.host,
//     // port: config.dbconfig.port,
//     // user: config.dbconfig.user,
//     // password: config.dbconfig.password,
//     // database: config.dbconfig.database,
//   },
// });

// export default knex({
//   client: "mysql",
//   connection: {
//     host: "localhost",
//     port: 3306,
//     user: "root",
//     password: "",
//     database: "supplierx",
//   },
// });
