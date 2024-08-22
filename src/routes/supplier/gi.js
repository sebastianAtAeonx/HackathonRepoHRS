import express from 'express';
import gi from '../../controller/workflow/gi.js'

const router = express.Router();

router.post('/giToSAP', gi.giToSap);
router.post('/getGICode',gi.getGiCode)
router.post('/listGI',gi.paginateGi)

export default router;