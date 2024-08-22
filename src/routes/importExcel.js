import express from "express"
import importXL from "../controller/importExcel.js";
import verifyToken from "../middleware/jwt.js";
const router=express.Router()

router.use("/import",importXL.importExcel)

export default router;