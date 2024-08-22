import express from "express";
import logistics from "../../controller/supplier/logistics.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router();
const moduleName = "Masters";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), logistics.createLogistics);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), logistics.paginateLogistic);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), logistics.viewLogistics);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), logistics.deleteLogistics);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), logistics.updateLogistics);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), logistics.delteMultipleRecords)

export default router;
