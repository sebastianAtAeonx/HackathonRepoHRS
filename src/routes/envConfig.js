import express from "express"
import envConfig from '../controller/envConfig.js'
import verifyToken from "../middleware/jwt.js";

const router = express.Router();

router.post('/create',verifyToken.verifyToken, envConfig.create);
router.put('/genSettings',verifyToken.verifyToken, envConfig.genSettings);
router.post("/viewGenSettings",verifyToken.verifyToken, envConfig.viewGenSettings);
router.put("/update",verifyToken.verifyToken,envConfig.update)
router.post('/listing',verifyToken.verifyToken, envConfig.paginate);
router.delete('/delete/:id',verifyToken.verifyToken,envConfig.deleteEnv)
router.post("/view/:id",verifyToken.verifyToken, envConfig.view);
router.post("/deleteall",verifyToken.verifyToken, envConfig.delteMultipleRecords);


export default router