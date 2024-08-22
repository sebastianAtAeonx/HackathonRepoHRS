import express from "express";
import master from "../../src/routes/services/masterIndia.js";
import sandBox from "../../src/routes/services/sandBox.js";
import zoop from "../../src/routes/services/zoop.js";
import verifyToken from "../middleware/jwt.js";
import msme from "../../src/controller/workflow/sandBoxController.js";
import logApiCalls from "../helpers/functions.js"
import surepass from "../../src/routes/services/surepass.js";
import razorpay from "../../src/routes/services/razorpay.js";

const router = express.Router();

router.use("/masterIndia", master); //checked
router.use("/sandBox", verifyToken.verifyToken, sandBox);
router.use("/zoop",zoop); //checked
router.post("/verifymsme",msme.verifyMsme);
router.post("/verifyBankACcount",msme.verifyBankAcc);
router.use("/surepass", surepass);
router.use("/razorpay", razorpay);

export default router;
