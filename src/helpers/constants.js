import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import knex from "../config/mysql_db.js";
import CryptoJS from "crypto-js";
// config.js
import dotenv from "dotenv";
dotenv.config({ silent: process.env.NODE_ENV === "production" });

// get ENV Variable values from table
function decryptData(encryptedData, secretKey) {
  const decryptedData = CryptoJS.AES.decrypt(encryptedData, secretKey).toString(
    CryptoJS.enc.Utf8
  );
  return decryptedData;
}

async function getEnv(value) {
  let secretKey = process.env.JWT_SECRET;
  const env = await knex("environment_variables")
    .select("env_value")
    .where({ env_key: value })
    .first();
  if (env && env.env_value) {
    const env_value = decryptData(env.env_value, secretKey);
    return env_value;
  } else {
    return "";
  }
}

// const env = await knex('environment_variables').select("*")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, "../");
const port = 3000;

const admindetails = {
  companyShortName: await getEnv("CO_SHORT_NAME"),
  companyFullName: await getEnv("CO_FULL_NAME"),
  address1: await getEnv("CO_ADD_1"),
  address2: await getEnv("CO_ADD_2"),
  state: await getEnv("CO_STATE"),
  country: await getEnv("CO_COUNTRY"),
  homePageUrl: await getEnv("CO_URL"),
  companyLogo: await getEnv("CO_LOGO"),
  registratonUrl: await getEnv("REG_URL"),
};

let BASE_URL = `http://localhost:${port}`;
const SUB_URI = "/api";
const STATIC_PATH = "/static";
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

//   BASE_URL = process.env.BASE_URL_PRO;
// }

const sapconfig = {
  url: await getEnv("SAP_PO_URL"),
  Authorization: await getEnv("AUTH"),
  ip: await getEnv("SAP_IP"),
  client: await getEnv("CLIENT"),
  clientCookie: await getEnv("CLIENT_COOKIE"),
};

const zoop = {
  apiKey: await getEnv("ZOOP_API_KEY"),
  appId: await getEnv("ZOOP_API_ID"),
  url: await getEnv("ZOOP_URL"),
};

/*
const masterindia = {
  client_id: "eoGSIFCkDbpEZOyQHC",
  Authorization: "Bearer 7686ac7a217b471b8acf1ab637bf7b1fdceb4f4b",
  url: "https://commonapi.mastersindia.co/",
};
*/

const aws = {
  accessKey: process.env.AWS_ACCESS_KEY_ID,
  secret: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
};

const bucket = process.env.Bucket;

const s3Creds = {
  accessKey: aws.accessKey,
  secret: aws.secret,
  bucket: process.env.S3_BUCKET,
  archiveBucket: process.env.S3_ARCHIVE_BUCKET,
};

const sesCredentials = {
  fromEmails: {
    emailOtp: await getEnv("OTP_EMAIL"),
    supportEmail: await getEnv("SUPPORT_EMAIL"),
    notificationEmail: await getEnv("NOTIFICATION_EMAIL"),
  },
  accessKey: aws.accessKey,
  secret: aws.secret,
  region: aws.region,
};

const jwtConfig = {
  // secret: process.env.JWT_SECRET,
  secret: await getEnv("JWT_SECRET"),
  refreshTokenSecret: await getEnv("JWT_REFRESH_TOKEN_SECRET"),
  expireTime: await getEnv("JWT_TOKEN_EXPIER_TIME"),
  refreshTokenExpireTime: await getEnv("JWT_REFRESH_TOKEN_EXPIER_TIME"),
};

const mailConfig = {
  mail: await getEnv("EMAIL"),
  password: await getEnv("EMAIL_PASSWORD"),
};

const transporter = nodemailer.createTransport({
  port: await getEnv("EMAIL_PORT"), // true for 465, false for other ports
  host: await getEnv("EMAIL_HOST"),
  auth: {
    user: mailConfig.mail,
    pass: mailConfig.password,
  },
  secure: true,
});

const processes = {
  supplierRegistration: "supplier_registration",
};
/*
const masterIndiaCreds = {
  userName: "chandresh.acharya@aeonx.digital",
  password: "Masters@123",
  client_id: "eoGSIFCkDbpEZOyQHC",
  client_secret: process.env.MASTER_INDIA_SECRET,
  grant_type: "password",
};
*/
//dyanamically from table fetch credentials done for sapCreds
/*
const sapCreds = {
  url: "http://10.200.1.37:8000/zsupplierx/vendor?sap-client=120",
  authentication: "Basic YWVvbnhhYmFwOldlbGNvbWVAMjAyNA==",
  cookie: "sap-usercontext=sap-client=120",
};
*/
/*
const sandBox = {
  url: "https://api.sandbox.co.in/",
  xApiKey: "key_live_fqYc9Uzc2rD0cUF7u39DbZiaAFL50OJg",
  xApiSecret: "secret_live_0K01qulW0DGdHoTLV2y1COIJaYa7Vru4",
  xApiVersion: "1.0",
  Authorization:
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsInJvbGUiOiIxIiwiZW1haWwiOiJhZG1pbkBhZG1pbi5jb20iLCJpYXQiOjE2ODk1ODE5MjMsImV4cCI6MTY4OTU4OTEyM30.w-FGL66pctrUTFCJyqCEpPW6d1Sr80f0RQQMTInI15w",
};
*/
/*
const msmekey = {
  url: "https://api.attestr.com/api/v1/public/corpx/udyam",
  Authorization:
    "Basic T1gwQWlYTFhrZklZX2xlMjhoLmRlMWY3NThjMTEwNzMwODk0ZWE0NGY4YThlYTQ1NzNhOjFiN2UzNWQ4MTc4Y2EzM2U5MTdlM2Y5YTdlYjhkYTkzZDE1M2EzOTdiNDgwOThlNw==",
};
*/
/*
const bankAccKey = {
  url: "https://api.attestr.com/api/v1/public/finanx/acc",
  Authorization:
    "Basic T1gwQWlYTFhrZklZX2xlMjhoLmRlMWY3NThjMTEwNzMwODk0ZWE0NGY4YThlYTQ1NzNhOjFiN2UzNWQ4MTc4Y2EzM2U5MTdlM2Y5YTdlYjhkYTkzZDE1M2EzOTdiNDgwOThlNw==",
};
*/

export default {
  port,
  // dbconfig,
  BASE_URL,
  SUB_URI,
  jwtConfig,
  STATIC_PATH,
  indexPath,
  mailConfig,
  transporter,
  zoop,
  s3Creds,
  admindetails,
  sesCredentials,
  processes,
  //masterIndiaCreds,
  //masterindia,
  aws,
  bucket,
  //sandBox,
  sapconfig,
  //msmekey,
  //sapCreds,
  //bankAccKey,
  getEnv,
};
