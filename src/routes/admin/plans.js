import express from "express";
import api from "../../controller/admin/plans.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();

const moduleName = "Masters";

router.post("/list", token.verifyTokenNew, api.paginatePlans);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), api.updatePlans);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), api.deletePlans);
router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), api.createPlans);
router.post("/view/:id", token.verifyTokenNew, api.viewPlans);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), api.delteMultipleRecords)

export default router;
