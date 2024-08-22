import express from "express";
import uom from "../../../src/controller/admin/uom.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters"
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), uom.createUom);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), uom.UpdateUom);
router.post("/list", token.verifyTokenNew, uom.PaginateUoms);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), uom.DeleteUom);
router.post("/view/:id", token.verifyTokenNew, uom.ViewUom);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),uom.delteMultipleRecords)
router.post("/import-excel",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), uom.importExcel)

export default router;
