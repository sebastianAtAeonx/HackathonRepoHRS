import express from "express";
import logs from "../../controller/admin/logs.js"
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Logs"

router.post("/list",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), logs.logsList)

export default router