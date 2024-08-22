import express from "express";
const router = express.Router();
import website from "../controller/website.js";

router.post("/scheduleDemo", website.scheduleDemo);

export default router;