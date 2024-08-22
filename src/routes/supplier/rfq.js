import express from "express";
import rfq from "../../controller/supplier/rfq.js";
import functions from "../../helpers/functions.js";
import token from "../../middleware/jwt.js";
const router = express.Router();

const moduleName = "Request for Quotation"

router.post("/create",rfq.createRfq);
router.delete("/delete/:id", rfq.deleteRfq);
router.put("/update",rfq.updateRfq);
router.post("/list", rfq.paginateRfq);
router.get("/view/:id", rfq.viewRfq);
// router.post('/rfqlist', rfq.PaginationRfqAn  dRfqItems)
//router.post('/status', rfq.RfqStatus)
router.post("/file-upload", rfq.fileUploadInRfq);
router.post("/deleteall", rfq.delteMultipleRecords);

export default router;
