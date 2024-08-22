import express from "express";
import zoopController from "../../../src/controller/workflow/zoopController.js";
import logApiCalls from "../../helpers/functions.js"


const router = express.Router();

router.post("/gst/verify",zoopController.verifyGst);
router.post("/bank/verifyAccount",zoopController.verifyBankAccount)

export default router;
