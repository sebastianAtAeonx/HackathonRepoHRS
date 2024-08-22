import express from "express"
import exportXL from "../controller/export.js";
import verifyToken from "../middleware/jwt.js";
const router=express.Router()

router.use("/fetchFields",exportXL.fetchFields)
router.use("/getData",verifyToken.verifyToken,exportXL.fetchData)
router.use("/export",verifyToken.verifyToken,exportXL.excelExport)

export default router;