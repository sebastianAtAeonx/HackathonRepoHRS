import express from 'express'
import foronboarding from "../../controller/supplier/foronboarding.js";

const router = express.Router()

router.post('/list',foronboarding.viewPage)



export default router