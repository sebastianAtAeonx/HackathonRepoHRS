import express from "express";
import plansTenures from "../../controller/admin/plansTenures.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js"; 

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), plansTenures.createPlanTenures);
router.post("/list", token.verifyTokenNew, plansTenures.paginatePlanTenures);
router.post("/view/:id", token.verifyTokenNew, plansTenures.viewPlanTenures);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), plansTenures.deletePlanTenures);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), plansTenures.updatePlanTenures);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), plansTenures.delteMultipleRecords)

export default router;
