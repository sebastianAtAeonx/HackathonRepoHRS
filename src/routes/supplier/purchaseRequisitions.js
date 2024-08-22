
import express from 'express'
import purchaseRequisitions from "../../controller/supplier/purchaseRequisitions.js";
import functions from "../../helpers/functions.js";
import token from "../../middleware/jwt.js"

const router=express.Router()

const moduleName = "Purchase Requisition"
router.post('/create',token.verifyTokenNew, functions.checkPermission(moduleName,"create"), purchaseRequisitions.createPurchaseRequisitions)

// router.post('/view/:id',purchaseRequisitions.viewPurchaseRequisitions)

router.put('/update',token.verifyTokenNew, functions.checkPermission(moduleName,"update"), purchaseRequisitions.updatePurchaseRequisitions)

// router.delete('/delete/:id',purchaseRequisitions.deletePurchaseRequisitions)

// router.post('/list',purchaseRequisitions.PaginatePurchaseRequisitions)

router.post('/pr-status',purchaseRequisitions.PrStatus)

router.post('/prlist',purchaseRequisitions.PaginatePRandPRItems)

router.post("/createpr",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), purchaseRequisitions.createPr)
router.put("/updatepr",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), purchaseRequisitions.updatePr)
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), purchaseRequisitions.viewPr);
router.post('/list',token.verifyTokenNew, functions.checkPermission(moduleName,"read"), purchaseRequisitions.paginatePr)
router.delete('/delete/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), purchaseRequisitions.deletePr)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), purchaseRequisitions.delteMultipleRecords)
router.post("/fetchPrList",purchaseRequisitions.fetchPrList)
router.post("/fetchPRDetails",purchaseRequisitions.fetchPrDetails)



export default router