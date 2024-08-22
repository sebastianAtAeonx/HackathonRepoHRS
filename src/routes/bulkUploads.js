import express from "express";
import bulkUppload from "../controller/bulkUploads.js";
import verifyToken from "../middleware/jwt.js";

const router = express.Router();

router.post("/create", verifyToken.verifyToken, bulkUppload.create);
router.put("/update", verifyToken.verifyToken, bulkUppload.update);
router.post("/listing", verifyToken.verifyToken, bulkUppload.paginate);
router.delete("/delete/:id", verifyToken.verifyToken, bulkUppload.del);
router.post("/view/:id", verifyToken.verifyToken, bulkUppload.view);
router.post(
  "/deleteall",
  verifyToken.verifyToken,
  bulkUppload.delteMultipleRecords
);

export default router;
