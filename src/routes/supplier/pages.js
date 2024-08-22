import express from "express";
import pages from "../../controller/supplier/pages.js";

const router = express.Router();

router.post("/view", pages.viewPage);

export default router;
