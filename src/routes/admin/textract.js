import express from "express";
import textract from "../../../src/controller/admin/textract.js";
import token from "../../middleware/jwt.js"

const router = express.Router();

router.post("/textract",token.verifyToken, textract.Textract);
router.post("/mapping",token.verifyToken, textract.forMapping);
router.post("/invoice", token.verifyToken, textract.automateInvoice2);
router.post("/mappedKeys",token.verifyToken, textract.mapping);
router.post("/bulkUpload",token.verifyToken, textract.bulkUpload);
router.post("/invoiceToSap",token.verifyToken, textract.insertToSap );
router.post("/deleteInvoice",token.verifyToken, textract.deleteInvoice );
router.post("/invoiceList", textract.paginateInvoices);
router.post("/list", textract.textractSubmittedInvocieList);
router.post("/view/:id", textract.viewdata);
router.delete("/delete/:id",token.verifyToken, textract.deletedata);
router.put("/update",token.verifyToken, textract.updatedata);
router.post("/translateAndTextract", textract.translateAndtextract);
router.post('/polistTextract',textract.getPOListForTextract)
router.post('/statusCount', textract.invoiceDashboardStatusCount)
export default router;
