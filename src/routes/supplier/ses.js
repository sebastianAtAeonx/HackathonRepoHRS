import express from "express";
import ses from '../../controller/workflow/ses.js'

const router = express.Router();

router.post('/sesToSap', ses.SEStoSAP)
router.post('/getSesCode', ses.getSESCode)
router.post('/listSES',ses.paginateSES)
export default router;