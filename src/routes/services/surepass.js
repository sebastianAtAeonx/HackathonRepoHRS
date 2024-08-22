import express from "express";
import surepass from "../../../src/controller/workflow/surepass.js";
const router = express.Router();
router.post("/verifyBankACcount",surepass.verifyBankAccount);
export default router;