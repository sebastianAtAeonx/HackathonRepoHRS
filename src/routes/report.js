import express from "express";
import master from "../../src/routes/services/masterIndia.js";
import sandBox from "../../src/routes/services/sandBox.js";
import zoop from "../../src/routes/services/zoop.js";
import verifyToken from "../middleware/jwt.js";
import msme from "../../src/controller/workflow/sandBoxController.js";
import supplierReport from "../../src/controller/report/supplierReport.js";
import asn from "../../src/controller/report/asnReport.js";

const router = express.Router();

router.post("/supplier/byDateMonthYear", verifyToken.verifyToken, supplierReport.byDateMonthYear);
router.post("/asn/byDateMonthYear", verifyToken.verifyToken, asn.asnReport);

export default router;
