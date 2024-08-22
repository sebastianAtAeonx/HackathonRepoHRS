import express from "express";
import rfqservices from "../../controller/supplier/rfqservices.js";

const router = express.Router();

router.post("/create", rfqservices.createRfqService);
router.post("/view/:id", rfqservices.viewRfqService);
router.post("/list", rfqservices.PaginationRfqService);
router.post("/status", rfqservices.RfqServiceStatus);
router.put("/update", rfqservices.updateRfqService);
router.delete("/delete/:id", rfqservices.deleteRfqService);
router.delete("/deleteAll", rfqservices.deleteAllService);
router.post("/deleteall",rfqservices.delteMultipleRecords)


export default router;
