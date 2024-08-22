import express from 'express'
import bids from "../../controller/supplier/bids.js";

const router = express.Router()

router.post('/create', bids.createBid)
router.delete('/delete/:id', bids.deleteBid)
router.put('/update', bids.updateBid)
router.post('/view/:id', bids.viewBid)
router.post('/list', bids.paginateBids)
router.post('/supplierrank', bids.supplierRank)
router.post('/rank', bids.rank)
router.post("/deleteall",bids.delteMultipleRecords)



export default router