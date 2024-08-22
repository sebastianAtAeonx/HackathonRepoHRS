import express from "express";
import storageLocation from "../../controller/supplier/storageLocation.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const moduleName = "Masters";
const router = express.Router();

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"),storageLocation.createStorageLocation);
router.post("/view/:id", token.verifyTokenNew, storageLocation.viewStorageLocation);
router.post("/list", token.verifyTokenNew, storageLocation.paginateStorageLocation);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), storageLocation.updateStorageLocation);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), storageLocation.deleteStorageLocation);
router.post("/insertCode",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), storageLocation.storageLocation)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), storageLocation.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), storageLocation.importExcel)


export default router;
