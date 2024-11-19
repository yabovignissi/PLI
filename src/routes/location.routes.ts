import express from 'express';
import {handleLocation,getLocation} from '../controllers/location.controller';

const routerLocation = express.Router();

routerLocation.post('/location',handleLocation);
routerLocation.get('/location/:userId/:tripId', getLocation);

export default routerLocation;
