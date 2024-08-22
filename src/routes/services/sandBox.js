import express from "express";

import sandBox from "../../../src/controller/workflow/sandBoxController.js";
import sandbox from "../../services/sandbox.js";
import logApiCalls from "../../helpers/functions.js"


const router = express.Router();

router.post("/authenticate", sandBox.authenticate2);
router.post("/sendotp", sandBox.sendOtpProcess);
router.post("/verifyotp", sandBox.verifyOtpProcess);
router.post("/ewaybill", sandBox.ewaybill);
router.post("/irn", sandBox.generateIRN);
router.post("/makeEwayBill", sandBox.makeEwayBill);
router.post("/ewayauthentication", sandBox.eWayAuthentication);
router.post("/refreshtoken", sandBox.refreshToken);
router.post("/verifyPan", sandBox.panValidate);
router.post("/verifyBankAc", sandBox.verifyBankAc);
router.post("/verifyGst", sandBox.verifyGst);
router.post("/verifySuppliersGst", sandBox.verifySuppliersGst);
router.post("/verifySuppliersPan", sandBox.verifySuppliersPan);
router.post("/start", sandBox.callPeriodicallyVerifyPan);
router.post("/stop", sandBox.stopPeriodicExecution);
router.post("/verifymsme", sandBox.verifyMsme);

export default router;
