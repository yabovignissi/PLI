import express from "express";
import {
  create,
  getAll,
  getById,
  deleteById,
  updateById,
  getTripsByUserId,
  getShare
} from "../controllers/Trips.controllers";
import authenticateJWT from "../middlewares/authenticateJWT";

const routertrip = express.Router();

routertrip.get("/trips", getAll);
routertrip.get("/trips/:id", getById);
routertrip.post("/trips", authenticateJWT, create);

routertrip.get('/trips/user/:id', authenticateJWT, getTripsByUserId); 
routertrip.put("/trips/:id", authenticateJWT, updateById);
routertrip.delete("/trips/:id", authenticateJWT, deleteById);
routertrip.get('/trips/share/:fullName/:tripId/:tripName', getShare);

export default routertrip;
