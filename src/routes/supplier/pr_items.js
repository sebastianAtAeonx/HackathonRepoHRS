import express from 'express'
import pr_items from "../../controller/supplier/pr_items.js";

const router = express.Router()

router.post('/create', pr_items.createPr_items)
router.post('/view/:id',pr_items.viewPr_items)
router.post('/list',pr_items.paginatePr_items)
router.delete('/delete/:id', pr_items.deletePr_items)
router.put('/update',pr_items.updatePr_items)
router.post("/deleteall",pr_items.delteMultipleRecords)



export default router