import express from "express";
import vendorSchema from "../../../src/controller/admin/vendorSchema.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters"
const router = express.Router();

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), vendorSchema.createVendorSchema);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), vendorSchema.deleteVendorSchema);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), vendorSchema.updateVendorSchema);
router.post("/view/:id", token.verifyTokenNew, vendorSchema.viewVendorSchema);
router.post("/list", token.verifyTokenNew, vendorSchema.paginateVendorSchema);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), vendorSchema.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), vendorSchema.importExcel);

export default router;
