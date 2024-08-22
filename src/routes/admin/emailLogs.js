import express from "express";
import emailLogs from "../../../src/controller/admin/emailLogs.js"
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Logs"
const router=express.Router()
router.post('/view/:id', token.verifyTokenNew, functions.checkPermission(moduleName,"read"), emailLogs.view);
router.post('/list',token.verifyTokenNew, functions.checkPermission(moduleName,"read"), emailLogs.list);

export default router;