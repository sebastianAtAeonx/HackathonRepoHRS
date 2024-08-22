import express from "express";
import payment from "../../../src/controller/admin/paymentType.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();

const moduleName = "Masters";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),payment.createPaymentType);
router.post("/get", payment.paginatePaymentType);
router.post("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"),payment.updatePaymentType);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),payment.deletePaymentType);
router.post("/view/:id", token.verifyTokenNew,payment.viewPaymentType);
router.post("/deleteall", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),payment.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), payment.importExcel);

export default router;
