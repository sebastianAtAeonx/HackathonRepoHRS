import express from "express";
import pr_services from "../../controller/supplier/pr_services.js";

const router = express.Router();

router.post("/create", pr_services.createService);
router.post("/view/:id", pr_services.viewService);
router.post("/list", pr_services.PaginationService);
router.delete("/delete/:id", pr_services.deleteService);
router.delete("/deleteAll", pr_services.deleteAllService);
router.put("/update", pr_services.updateService);
router.put("/changeStatus", pr_services.changeStatusService);
router.post("/deleteall",pr_services.delteMultipleRecords)


export default router;
