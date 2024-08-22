import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
// import v1 from "./routes/v1.js";
import knex from "./config/mysql_db.js";
import verifyToken from "./middleware/jwt.js";
import constants from "./helpers/constants.js";
import { readFileSync } from "fs";
// import functions from "./helpers/functions.js";
// import s3 from "./s3/s3.js";
import rateLimit from "express-rate-limit";
import {databaseName} from "./config/mysql_db.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = constants.port;
const sub_uri = constants.SUB_URI;

// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(constants.STATIC_PATH, express.static(path.join(__dirname, "uploads")));
app.get(`${sub_uri}/hello`, (req, res) => {
  res.status(200).json({
    error: false,
    message: "Hello",
  });
});

app.get(`${sub_uri}/upload`, async (req, res) => {
  const buffer = JSON.parse(readFileSync("test.json").toString());
  await knex("states").insert(buffer);
});

app.post(`${sub_uri}/get-nav`, async (req, res) => {
  const nav = await functions.getPagesByPanel(1);
  res.json({
    error: false,
    message: "nav recieved Successfully",
    data: {
      nav,
    },
  });
});

app.post(`${sub_uri}/get-url`, async (req, res) => {
  const { fileName, fileType } = req.body;
  try {
    const data = await s3.getPresignedUrl(fileName, fileType);
    res.json(data);
  } catch (err) {
    return res.json({
      error: true,
      message: "Something went Wrong",
      data: {
        trace: JSON.stringify(err),
      },
    });
  }
});

try {
  const dbConnectionStatus = await knex("information_schema.tables")
    .count("* as tableCount")
    .where("table_schema", databaseName);
    // .where("table_schema", constants.dbconfig.database);
  console.log('\x1b[32m%s\x1b[0m',"\nDatabase Connection Status: ", dbConnectionStatus[0].tableCount + " tables are found and connected\n");
} catch (error) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "\nDatabase Connection has:",
    error + "\n"
  );
}

app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      `<div style='height:97vh; display:flex; justify-content:center; align-items:center'><h1><center>Greetings & Welcome to the SupplierX Backend!<br> <a href='${constants.admindetails.homePageUrl}'>Login</a></center></h1></div>`
    );
});

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Path Not found.",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(sub_uri);
});
