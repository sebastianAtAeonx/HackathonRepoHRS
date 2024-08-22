import express from "express";
import asn from "../../controller/supplier/asn.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "ASN/SCR";
const qrModule="Scan QR"
const scanHistoryModule="Scanned History"

const router = express.Router();

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), asn.createAsn3);
router.post("/view/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"read"),  asn.viewAsn2);
router.post("/viewScanHistory/:id",token.verifyTokenNew,functions.checkPermission(scanHistoryModule, "read"), asn.viewAsn2);
router.post("/list",token.verifyTokenNew,  asn.PaginateAsn);
router.post("/qrcode/:id", asn.QRCodeAsn);
router.post("/getqrcode", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), asn.getQRCode);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"),  asn.updateAsn2);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),  asn.deleteAsn2);
router.post("/checkqr",token.verifyTokenNew, functions.checkPermission(qrModule,"create"),  asn.checkQRCode);
router.post("/asnStatusChange/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"update"),  asn.asnStatusChange);
router.post("/asnPaymentUpdate",token.verifyTokenNew, functions.checkPermission(moduleName,"update"),  asn.asnPaymentStatusUpdate);
router.post("/asnHistory/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"read"),  asn.viewAsnStatusHistory);
router.post("/asnCurrentStatus/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"read"),  asn.viewAsnCurrentStatus);
router.post("/workflowStatus", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), asn.workFlowStatus);

//router.post("/changeScrStatus",asn.changeScrStatus)
// router.post("/viewasn3/:id",asn.viewAsn3)
router.post("/asnMaterialReceived",token.verifyTokenNew, functions.checkPermission(qrModule,"update"),  asn.asnMaterialReceived);
router.post("/asnGateInward2", asn.asnGateInward2);
router.post("/asnGateInward", asn.asnGateInward);

router.post("/userhistory",token.verifyTokenNew, functions.checkPermission(scanHistoryModule,"read"),  asn.scannerHistory);
router.put("/vehicalStatusUpdate",token.verifyTokenNew, functions.checkPermission(moduleName,"update"),  asn.updateVehicalStatus);
router.delete("/cancelASN/:asn_id", asn.cancelASN);

router.post("/unitconversion", asn.unitConversion);
router.post("/getQuantity", asn.getRemaingQuantity);
router.post("/excelExport", asn.exportToExcel);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),  asn.delteMultipleRecords);

export default router;
