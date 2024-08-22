import express from "express";
import msme from "../../../src/controller/admin/msme.js"

const router=express.Router()
router.post("/sendOtp", msme.sendOtp);
router.post("/submitOtp", msme.submitOtp);
router.post("/getMsmeDetails",msme.getMsmeDetails);

export default router;