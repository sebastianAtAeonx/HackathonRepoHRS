import express from "express";
import payment_terms from "../../../src/controller/admin/paymentTerms.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), payment_terms.createPt);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), payment_terms.updatePt);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), payment_terms.deletePt);
router.post("/view/:id", token.verifyTokenNew, payment_terms.viewPt);
router.post("/list", token.verifyTokenNew, payment_terms.listPt);
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),payment_terms.importExcel);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), payment_terms.delteMultipleRecords)

export default router;
