import express from "express";
import grn from "../../controller/workflow/grn.js";
import verifyToken from "../../helpers/functions.js";

const router = express.Router();

router.post("/normalgrn", grn.normalgrn);
router.post("/incomingInvoice", grn.incomingInvoice);
router.post("/list", grn.listInvoice);
router.post("/view/:id", grn.viewInvoice);
router.put("/update", grn.updateInvoice);
router.delete("/delete/:id", grn.deleteInvoice);
router.post("/grnToSap", grn.GRNtoSAP);
router.post("/invoiceToSap", grn.invoiceToSapNewFormat);
router.post("/previnvoiceToSap", grn.invoiceToSap);
router.post("/sesToSap", grn.SEStoSAP);

router.post("/getGrnCode", grn.insertGRNCode);
router.post("/sapToInvoiceCode", grn.sapToInvoiceCode);
router.post("/getInvoiceCode", grn.insertInvoiceCode);
router.post("/listallinvoices", grn.listAllInvoice);
router.post("/viewinvoicebyid/:id", grn.viewInvoiceById);

router.post("/deleteGRNCode", grn.removeGRNCode);
router.post("/updateGRNCode", grn.updateGRNCode);
router.post("/listgrns",grn.paginateGrn)
export default router;
