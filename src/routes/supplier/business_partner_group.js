import express from "express";
import business_partner_group from "../../controller/supplier/business_partner_group.js";
import token from "../../middleware/jwt.js";

const router = express.Router();

router.post(
  "/create",
  token.adminauthenticateToken,
  business_partner_group.createBps
);
router.post("/list", business_partner_group.paginateBps);
router.post("/view/:id", business_partner_group.viewBps);
router.delete(
  "/delete/:id",
  token.adminauthenticateToken,
  business_partner_group.deleteBps
);
router.put(
  "/update",
  token.adminauthenticateToken,
  business_partner_group.updateBps
);
router.post("/deleteall",business_partner_group.delteMultipleRecords)


export default router;
