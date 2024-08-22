import express from "express";
import businessType from "../../controller/admin/businessType.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const router = express.Router();

const moduleName = "Masters"
router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), businessType.createBusinessType);
router.post("/list", token.verifyTokenNew ,businessType.paginateBusinessType);
router.post("/view/:id", token.verifyTokenNew , businessType.viewBusinessType);
router.put("/update", token.verifyTokenNew , functions.checkPermission(moduleName,"update"), token.verifyToken, businessType.updateBusinessType);
router.delete("/delete/:id",token.verifyTokenNew , functions.checkPermission(moduleName,"delete"), businessType.deleteBusinessType);
router.post("/deleteall",token.verifyTokenNew , functions.checkPermission(moduleName,"delete"), businessType.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),businessType.importExcel);


export default router;
