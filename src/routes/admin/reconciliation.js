import express from "express";
import recAcc from "../../../src/controller/admin/reconciliation.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), recAcc.createReconciliation);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), recAcc.deleteReconcilition);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), recAcc.updateReconciliation);
router.post("/list", token.verifyTokenNew, recAcc.paginateReconciliation);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), recAcc.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), recAcc.importExcel);

export default router;
