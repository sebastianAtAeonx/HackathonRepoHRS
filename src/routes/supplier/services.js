import express from "express";
import services from "../../controller/supplier/services.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), services.createService);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), services.viewService);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), services.PaginationService);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), services.updateService);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), services.deleteService);
router.delete("/deleteAll", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), services.deleteAllService);
// router.put('/change_status',services.changeStatusService)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), services.delteMultipleRecords)


export default router;
