import express from "express";
import invoice from '../../controller/workflow/invoice.js';
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Sap Invoice";

router.post('/incomingInvoice', token.verifyTokenNew, functions.checkPermission(moduleName,"read"),invoice.incomingInvoice);
router.post('/list', token.verifyTokenNew, functions.checkPermission(moduleName,"read"), invoice.listInvoice);
router.post('/view/:id', token.verifyTokenNew, functions.checkPermission(moduleName,"read"), invoice.viewInvoice);
router.post('/update', token.verifyTokenNew, functions.checkPermission(moduleName,"update"), invoice.updateInvoice);
router.post('/delete/:id', token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), invoice.deleteInvoice);
router.post('/invoiceToSap',invoice.invoiceToSapNewFormat);
router.post('/previnvoiceToSap', invoice.invoiceToSap);
router.post('/sapToInvoiceCode', invoice.sapToInvoiceCode);
router.post('/getInvoiceCode', invoice.insertInvoiceCode);
router.post('/listallInvoice', token.verifyTokenNew, functions.checkPermission(moduleName,"read"), invoice.listAllInvoice);
router.post('/viewinvoicebyid/:id', token.verifyTokenNew, functions.checkPermission(moduleName,"read"), invoice.viewInvoiceById);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), invoice.delteMultipleRecords)


export default router;