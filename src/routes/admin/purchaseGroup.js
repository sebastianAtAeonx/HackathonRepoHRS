import express from "express";
import pg from "../../../src/controller/admin/purchaseGroup.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), pg.createPurchaseGroup);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"),pg.updatePurchaseGroup);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), pg.deletePurchaseGroup);
router.post("/view/:id", token.verifyTokenNew, pg.viewPurchaseGroup);
router.post("/list", token.verifyTokenNew, pg.paginatePurchaseGroup);
router.post('/import-excel', token.verifyTokenNew, functions.checkPermission(moduleName,"create"),pg.importExcel)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), pg.delteMultipleRecords)

export default router;
