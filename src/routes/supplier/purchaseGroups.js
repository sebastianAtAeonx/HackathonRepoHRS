import express from "express";
import pg from "../../controller/supplier/purchaseGroups.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router();
const moduleName = "Masters";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), pg.createPurchaseGroup);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), pg.viewPurchaseGroup);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), pg.paginatePurchaseGroup);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), token.adminauthenticateToken, pg.updatePurchaseGroup);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),pg.deletePurchaseGroup);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), token.adminauthenticateToken,pg.delteMultipleRecords)


export default router;
