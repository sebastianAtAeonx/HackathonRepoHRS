import express from "express";
import auctions from "../../controller/supplier/auctions.js";
import logUserActivity from "../../logs/logs.js";
import rolemid from "../../helpers/functions.js";
import jwt from "../../middleware/jwt.js"
import logs from "../../middleware/logs.js"

const router = express.Router();

router.post("/create",jwt.verifyTokenNew,rolemid.userActivityMiddleware, auctions.createAuction);
router.delete("/delete/:id",jwt.verifyTokenNew,logs.logOldValues, auctions.deleteAuction);
router.put("/update",jwt.verifyTokenNew,logs.logOldValues, auctions.updateAuction);
router.post("/view/:id",jwt.verifyTokenNew,rolemid.newLogUserActivity,auctions.viewAuction);
router.post("/list",jwt.verifyTokenNew,rolemid.userActivityMiddleware, auctions.paginateAuction);
router.post("/deleteall",auctions.delteMultipleRecords)


export default router;
