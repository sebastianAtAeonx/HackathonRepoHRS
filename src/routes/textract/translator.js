import express from "express";
import translator from "../../controller/translator.js";

const router = express.Router();

router.post('/translate',translator.translateAndtextract)

export default router