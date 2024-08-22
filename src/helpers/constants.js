import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import knex from "../config/mysql_db.js";
import CryptoJS from "crypto-js";
// config.js
import dotenv from "dotenv";
dotenv.config({ silent: process.env.NODE_ENV === "production" });

const port = process.env.PORT || 3000;

let BASE_URL = `http://localhost:${port}`;
const SUB_URI = "/api";
const STATIC_PATH = "/static";
let dbconfig = {
  host: "localhost",
  user: "root",
  port: "3306",
  password: "",
  database: "supplierx",
};
const mode = process.env.DB_ENVIRONMENT; // dev,pro

if (mode == "pro") {
  dbconfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
  };

  BASE_URL = process.env.BASE_URL_PRO;
}


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

const jwtConfig = {
  secret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  expireTime: process.env.JWT_TOKEN_EXPIER_TIME,
  refreshTokenExpireTime: process.env.JWT_REFRESH_TOKEN_EXPIER_TIME,
};

export default {
  port,
  dbconfig,
  BASE_URL,
  SUB_URI,
  jwtConfig,
  STATIC_PATH,
  aws,
  bucket,
  s3Creds,
};
