import express from "express";
import sapErrors from '../../controller/forSAP/sapErrors.js'

const router = express.Router();

router.post('/sendErrors',sapErrors.insertSapError)
router.post('/viewSapError',sapErrors.viewSapError)

export default router