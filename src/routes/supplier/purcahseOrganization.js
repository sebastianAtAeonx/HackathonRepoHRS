import express from "express";
import pOrg from "../../controller/supplier/purchaseOrganization.js"
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router();
const moduleName="Masters"

router.post('/create',token.verifyTokenNew, functions.checkPermission(moduleName,"create"), pOrg.createPurchaseOrganization)
router.post('/update',token.verifyTokenNew, functions.checkPermission(moduleName,"update"), pOrg.updatePurchaseOrganization)
router.delete('/delete/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),pOrg.deletePurchaseOrganization)
router.post('/view/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"read"),pOrg.listPurchaseOrganization)
router.post('/listing',token.verifyTokenNew, functions.checkPermission(moduleName,"read"), pOrg.paginatePO)
router.post('/import-excel',token.verifyTokenNew, functions.checkPermission(moduleName,"create"), pOrg.importExcel)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),pOrg.delteMultipleRecords)


export default router;          
