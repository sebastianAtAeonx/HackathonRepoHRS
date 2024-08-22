import express from "express";
import countries from "./countries.js";
import currency from "./currency.js";
import companies from "./companies.js";

const router = express.Router();
router.use("/country", countries);
router.use("/currency", currency);
router.use("/companies", companies);

export default router;
