import express from "express"
import forSap from "../../src/routes/forSap/supplierlist.js"

const router=express.Router()

router.use("/sap",forSap)

export default router;