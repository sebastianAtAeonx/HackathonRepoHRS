import express from 'express'
import rfq_items from "../../controller/supplier/rfqitems.js";

const router = express.Router()

router.post('/create', rfq_items.createRfqItems)
router.post('/list',rfq_items.paginateRfqItems)
router.put('/update',rfq_items.updateRfqItems)
router.delete('/delete/:id', rfq_items.deleteRfqItems)
router.post('/view/:id',rfq_items.viewRfqItems)
router.post("/deleteall",rfq_items.delteMultipleRecords)



export default router