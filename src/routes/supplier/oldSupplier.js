import express from "express";
import oldSupplier from "../../controller/supplier/oldSupplier.js";
import verifyToken from "../../middleware/jwt.js";

const router = express.Router();

router.post("/withSapCode", oldSupplier.paginateWithSapCode);
router.post("/update", verifyToken.verifyToken, oldSupplier.updateOldSupplier);
router.post("/tosap", verifyToken.verifyToken, oldSupplier.tosap);
router.post("/oldRecords", oldSupplier.paginateOldRecords);
router.post("/view/:id", oldSupplier.viewSupplier);

export default router;
