import express from "express";
import { BackgroundImageController } from "../controller/backgroundImage.controller.js";

const router = express.Router();

router.get("/", BackgroundImageController.getBackgroundImages);

export default router;
