import express from "express";
import razorpay from "../../../src/controller/workflow/razorpay.js";
const router = express.Router();
router.post("/ifsctobankdetails/:ifsc", razorpay.ifsctobankdetails);
export default router;
