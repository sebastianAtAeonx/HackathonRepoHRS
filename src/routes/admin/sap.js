import express from "express";
import forsap from "../../controller/forSAP/supplierlist.js";
import verifyToken from "../../helpers/functions.js";

const router = express.Router();

router.post("/list", forsap.listSupplier);
router.post("/updateToday", forsap.updateToday);
router.post("/sendToSap", forsap.sendToSap);
router.post("/viewSupplier/:id", forsap.viewSupplier);
router.put("/getSapCode", forsap.getSapCode);
router.post("/sapToPortal", forsap.sapToDb);
router.post("/importExcel", forsap.importExcel);

export default router;
