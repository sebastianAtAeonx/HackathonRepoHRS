import express from "express";
import purchaseOrders from "../../controller/supplier/purchaseOrders.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router();
const moduleName="Purchase Order"
router.post("/getCsrf", token.verifyTokenNew, functions.checkPermission(moduleName,"read"),purchaseOrders.getCsrf);
router.post("/fetchPoDetails",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), purchaseOrders.fetchPoDetails);
router.post("/fetchPoList",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), purchaseOrders.fetchPoList);
//router.post('/fetchSupplierDetails',purchaseOrders.fetchSupplierDetail)


export default router;
