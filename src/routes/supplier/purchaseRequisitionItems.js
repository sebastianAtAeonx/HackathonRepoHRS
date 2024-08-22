
import express from 'express'
import purchaseRequisitionItems from "../../controller/supplier/purchaseRequistionItem.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';


const router=express.Router()
const moduleName="Purchase Requisition"


router.post('/create',token.verifyTokenNew, functions.checkPermission(moduleName,"create"),purchaseRequisitionItems.createPrItems)

router.post('/view/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"read"),purchaseRequisitionItems.viewPurchaseRequisitionItems)

router.put('/update',token.verifyTokenNew, functions.checkPermission(moduleName,"update"),purchaseRequisitionItems.updatePurchaseRequisitionItems)

router.delete('/delete/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),purchaseRequisitionItems.deletePurchaseRequisitionItems)

router.post('/list',token.verifyTokenNew, functions.checkPermission(moduleName,"read"),purchaseRequisitionItems.PaginatePurchaseRequisitionItems)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),purchaseRequisitionItems.delteMultipleRecords)




export default router