import express from "express";
import addCoDetails from "../../controller/supplier/addCoDetails.js";
import functions from "../../helpers/functions.js";
import token from "../../middleware/jwt.js";

// additional company details
const router = express.Router();
const supplierListModule = "Suppliers List";

router.post("/create", addCoDetails.createaddCoDetails);
router.post("/list", addCoDetails.listaddCoDetails);
router.post("/pages", addCoDetails.paginateCoDetails);

router.delete("/delete/:id", addCoDetails.deleteAddCoDetails);
// router.put("/update", addCoDetails.updateaddCoDetails);
router.post(
  "/view/:supplier_id",
  token.verifyTokenNew,
  functions.checkPermission(supplierListModule, "read"),
  addCoDetails.viewaddCoDetails
);
router.post("/deleteall", addCoDetails.delteMultipleRecords);

export default router;
