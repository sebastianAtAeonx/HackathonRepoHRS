import express from "express";
import master from "../../../src/controller/workflow/masterIndiaController.js";
import logApiCalls from "../../helpers/functions.js"

const router = express.Router();

router.post("/gst/verify", master.verifyGst);
router.post("/pan/verify", master.verifyPan);
router.post("/bulkpanverificationstart", master.callPeriodicallyVerifyPan);
router.post("/bulkpanverificationstop", master.stopPeriodicallyVerifyPan);
router.post('/insertAll', master.addAllRecordsAtOnce)
router.post('/gst/validateAll', master.gstComplianceCheck)
router.post('/gst/validateSelected', master.gstComplianceCheckUpdated)
router.post('/pan/validateAll', master.panComplianceCheck)
router.post('/pan/validateSelected', master.panComplianceCheckUpdated)
router.post("/msme/validateAll",master.msmeComplianceCheck)
router.post("/msme/validateSelected",master.msmeComplianceCheckUpdated)
router.post('/gst/list', master.getGST)
router.post('/pan/list', master.getPAN)
router.post("/msme/list",master.getMsme)
router.post('/authForIrn',master.authForIrn)
router.post("/generateIrn",master.generateIrn)
router.post("/generateewaybill",master.generateEwayBill)
router.post("/lineitems",master.getLineItems)
router.post("/supplierDetails",master.getSupplierDetails)
router.post('/gst/timeline', master.getGstTimeline)
router.post("/msme/excelExport",master.excelExport)
router.post("/pan/excelExport",master.excelExport)
router.post("/gst/excelExport",master.excelExport)
router.post("/gst/deleteall", master.deleteMultipleRecordsGST)
router.post("/pan/deleteall", master.deleteMultipleRecordsPan)
router.post("/msme/deleteall", master.deleteMultipleRecordsMsme)
router.post("/irn/verify",master.getEinvoiceData)

export default router;
