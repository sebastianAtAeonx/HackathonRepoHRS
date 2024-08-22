import express from "express";
import vendorClass from "../../../src/controller/admin/vendorClass.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js"; 

const moduleName = "Masters"
const router = express.Router();

router.post("/list", token.verifyTokenNew, vendorClass.vendorClassList);
router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), vendorClass.vendorClassCreate);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), vendorClass.vendorClassDelete);
router.post("/view/:id", token.verifyTokenNew, vendorClass.vendorClassView);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"),  vendorClass.vendorClassUpdate);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), vendorClass.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), vendorClass.importExcel);

export default router;
