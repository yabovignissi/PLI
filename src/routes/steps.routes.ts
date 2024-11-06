import express from "express";
import {
  create,
  getAll,
  getById,
  updateById,
  deleteById,
  getStepsByTripId,
} from "../controllers/steps.controller";
import authenticateJWT from "../middlewares/authenticateJWT";
import { upload } from "../middlewares/multer";

const routerstep = express();

routerstep.get("/steps", getAll);
routerstep.get("/steps/trip/:tripId", getStepsByTripId);
routerstep.get("/steps/:id", getById);
routerstep.post("/steps", authenticateJWT, upload.array('photos'),create);
routerstep.put("/steps/:id", authenticateJWT,upload.array('photos'), updateById);
routerstep.delete("/steps/:id", authenticateJWT, deleteById);

export default routerstep;
