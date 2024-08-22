import express from "express";
import supplier from "../../src/routes/supplier/supplier.js";
import approver from "../../src/routes/supplier/approver.js";
import auctions from "../../src/routes/supplier/auctions.js";
import bids from "../../src/routes/supplier/bids.js";
import bpg from "../../src/routes/supplier/business_partner_group.js";
import onboarding from "../../src/routes/supplier/foronboarding.js";
import itemCategory from "../../src/routes/supplier/item_category.js";
import items from "../../src/routes/supplier/items.js";
import logistics from "../../src/routes/supplier/logistics.js";
import materialType from "../../src/routes/supplier/materialType.js";
import materialCategory from "../../src/routes/supplier/materialCategory.js";
import materialGroup from "../../src/routes/supplier/materialGroup.js";
import materials from "../../src/routes/supplier/materials.js";
import minorityIndicator from "../../src/routes/supplier/minority_indicator.js";
import pages from "../../src/routes/supplier/pages.js";
import prItems from "../../src/routes/supplier/pr_items.js";
import prServices from "../../src/routes/supplier/pr_services.js";
import ponew from "../../src/routes/supplier/purchase_orders.js";
import purchaseGroup from "../../src/routes/supplier/purchaseGroups.js";
import purchaseReqItems from "../../src/routes/supplier/purchaseRequisitionItems.js";
import reconAcc from "../../src/routes/supplier/recouncillation_account.js";
import rfqItems from "../../src/routes/supplier/rfq_items.js";
import services from "../../src/routes/supplier/services.js";
import states from "../../src/routes/supplier/states.js";
import storageLocation from "../../src/routes/supplier/storageLocation.js";
import typeOfRecipient from "../../src/routes/supplier/typeOfRecipent.js";
import purchaseOrders from "../../src/routes/supplier/purchaseOrders.js";
import addCoDetails from "../../src/routes/supplier/addCoDetails.js";
import rfqServices from "../../src/routes/supplier/rfqservices.js";
import asn from "../../src/routes/supplier/asn.js";
import grn from "../../src/routes/supplier/grn.js";
import printSettings from "../../src/routes/supplier/printSettings.js";
import verifyToken from "../middleware/jwt.js";
import pr from "../../src/routes/supplier/purchaseRequisitions.js";
import oldSupplier from "../../src/routes/supplier/oldSupplier.js";
import rfq from "../../src/routes/supplier/rfq.js";
import dashboard from "../routes/supplier/approverDashboard.js"
import poDashboard from "../routes/supplier/poDashboard.js"
import invoice from '../routes/supplier/invoice.js'
import ses from '../routes/supplier/ses.js'
import gi from '../routes/supplier/gi.js'
import pOrg from "../routes/supplier/purcahseOrganization.js"
const router = express.Router();

//router.use(verifyToken.jwtMiddleware)
//router.use(verifyToken.guard.check([['Supplier'],['supplier']]))

router.use("/po", purchaseOrders);
router.use("/rfq", rfq);
router.use("/addCoDetails", addCoDetails);
router.use("/supplier", supplier);
router.use("/approver", approver); //checked
router.use("/auctions", auctions); //checked
router.use("/bids", verifyToken.verifyToken, bids); //checked
router.use("/bpg", verifyToken.verifyToken, bpg);
router.use("/onboarding", onboarding); //checked
router.use("/itemCategory", verifyToken.verifyToken, itemCategory); //checked
router.use("/items", verifyToken.verifyToken, items); //checked
router.use("/logistics", verifyToken.verifyToken, logistics); //checked
router.use("/materialGroup", materialGroup); //checked
router.use("/materials", materials); //checked
router.use("/materialType", materialType);
router.use("/materialCategory", materialCategory);
router.use("/minorityIndicator", minorityIndicator);
router.use("/pages", verifyToken.verifyToken, pages); //checked
router.use("/prItems", verifyToken.verifyToken, prItems);
router.use("/prServices", verifyToken.verifyToken, prServices); //checked
router.use("/ponew", ponew); //checked
router.use("/reconAcc", reconAcc);
router.use("/purchaseReqItems", verifyToken.verifyToken, purchaseReqItems); //checked
router.use("/rfqItems", verifyToken.verifyToken, rfqItems); //checked
router.use("/services", verifyToken.verifyToken, services); //checked
router.use("/states", verifyToken.verifyToken, states); //checked
router.use("/storageLocation", storageLocation); //checked
router.use("/typeOfRecipient", verifyToken.verifyToken, typeOfRecipient); //checked 90%
router.use("/purchaseGroup", verifyToken.verifyToken, purchaseGroup);
router.use("/rfqServices", verifyToken.verifyToken, rfqServices);
router.use("/asn", verifyToken.verifyToken, asn);
router.use("/grn", verifyToken.verifyToken, grn);
router.use("/printsettings", verifyToken.verifyToken, printSettings);
router.use("/pr",verifyToken.verifyToken, pr);
router.use("/oldSupplier", oldSupplier);
router.use("/dashboard",verifyToken.verifyToken, dashboard);
router.use("/po/dashboard",verifyToken.verifyToken, poDashboard);
router.use("/invoice", verifyToken.verifyToken, invoice);
router.use("/ses",verifyToken.verifyToken,ses)
router.use("/gi", verifyToken.verifyToken, gi)
router.use("/purchaseOrg", verifyToken.verifyToken, pOrg)

export default router;
