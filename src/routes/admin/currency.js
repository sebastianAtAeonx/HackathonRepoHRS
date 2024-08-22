import express from "express";
import currency from "../../../src/controller/admin/currency.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const moduleName = "Masters";

const router = express.Router();

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), currency.createCurrency);
router.post("/get", currency.paginateCurrency);
router.post("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), token.verifyToken, currency.updateCurrency);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), token.verifyToken, currency.deleteCurrency);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), token.verifyToken,currency.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), currency.importExcel)

export default router;
