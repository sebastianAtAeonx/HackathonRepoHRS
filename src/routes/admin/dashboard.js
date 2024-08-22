import express from "express";
import dashboard from "../../controller/admin/dashboard.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Dashboard";
const router = express.Router();

router.post("/percentage", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.percentage);
router.post("/supplier-analytics", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.supplier_analytics);
router.post("/count", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.count);
router.post("/count-time-bound", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.count_time_bound);
router.post("/totalAsnScr", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.total_asn_scr);
router.post("/detailedAsn", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.detailedAsn);
router.post("/detailedAsnSupplierWise/:supplierId", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.detailedAsnSupplierWise);
router.post("/detailedScr", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.detailedScr);
router.post("/detailedScrSupplierWise/:supplierId", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.detailedScrSupplierWise);
router.post("/detailedAsnWithSupplier", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.detailedAsnWithSupplier)
router.post("/supplierProducts/:supplierId",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.supplierProducts);
router.post("/deliveryPerformance",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.deliveryPerformance)

export default router;
