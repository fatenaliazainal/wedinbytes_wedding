import { Router, type IRouter } from "express";
import healthRouter from "./health";
import invitationRouter from "./invitation";
import rsvpRouter from "./rsvp";
import designRouter from "./design";
import authRouter from "./auth";
import cardsRouter from "./cards";
import reviewsRouter from "./reviews";
import pricingRouter from "./pricing";
import orderRouter from "./orders";
import businessRouter from "./business";
import toyyibPayRouter from "./toyyibpay";
import billplzRouter from "./billplz";
import waxSealsRouter from "./wax-seals";
import giftRegistryRouter from "./gift-registry";
import siteSettingsRouter from "./site-settings";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(invitationRouter);
router.use(rsvpRouter);
router.use(designRouter);
router.use(cardsRouter);
router.use(reviewsRouter);
router.use(pricingRouter);
router.use(orderRouter);
router.use(businessRouter);
router.use(toyyibPayRouter);
router.use(billplzRouter);
router.use(waxSealsRouter);
router.use(giftRegistryRouter);
router.use(siteSettingsRouter);

export default router;
