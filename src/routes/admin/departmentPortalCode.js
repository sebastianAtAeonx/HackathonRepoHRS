import express from "express";
import departmentPortalCode from "../../controller/departmentPortalCode.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters";

const router = express.Router();

router.post("/list", departmentPortalCode.list);
router.post("/filter/:dept_id", departmentPortalCode.filter);

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), departmentPortalCode.create);
router.post("/view/:id", token.verifyTokenNew, departmentPortalCode.view);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),departmentPortalCode.deleted);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"),departmentPortalCode.update);
router.post("/paginate", token.verifyTokenNew, departmentPortalCode.paginate);
router.post("/create2",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), departmentPortalCode.create2)

export default router;
