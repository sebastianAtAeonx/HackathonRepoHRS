import express from "express";
import dashboard from "../../controller/supplier/approverDashboard.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Dashboard";
const router = express.Router();

router.post("/supplier-details", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.supplier_details);
router.post("/time-bound", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.count_time_bound);
router.post("/percentage",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.percentage);

export default router;
