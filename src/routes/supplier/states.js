import express from 'express'
import states from "../../controller/supplier/states.js";

const router=express.Router()

router.post('/view',states.viewState)

export default router;
