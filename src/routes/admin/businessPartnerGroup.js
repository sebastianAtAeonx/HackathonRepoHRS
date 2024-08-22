import express from "express";
import businessPartnerGroup from "../../controller/admin/businessPartnerGroup.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const moduleName = "Masters"
const router = express.Router();

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), businessPartnerGroup.createBps);
router.post("/list", token.verifyTokenNew, businessPartnerGroup.paginateBps);
router.post("/view/:id",token.verifyTokenNew, businessPartnerGroup.viewBps);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), businessPartnerGroup.updateBps);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), businessPartnerGroup.deleteBps);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), businessPartnerGroup.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),businessPartnerGroup.importExcel);

export default router;
