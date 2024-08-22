import express from "express";
import sapErrors from '../../routes/forSap/sapErrors.js'

const router = express.Router();

router.use('/sapError',sapErrors)

export default router;