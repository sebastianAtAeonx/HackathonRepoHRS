import express from "express";
import purchase_orders from "../../controller/supplier/purchase_orders.js";
import functions from "../../helpers/functions.js";
import token from "../../middleware/jwt.js"

const router = express.Router();

const moduleName = "Purchase Order"

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), purchase_orders.createPurchaseOrder); //
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), purchase_orders.PaginatePurchaseOrder); //
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), purchase_orders.viewPurchaseOrder); //
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), purchase_orders.updatePurchaseOrder); //
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), purchase_orders.deletePurchaseOrder); //
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), purchase_orders.delteMultipleRecords)


export default router;
