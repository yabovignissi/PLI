import express from 'express';
import {handleLocation,getLocation,getAll} from '../controllers/location.controller';

const routerLocation = express.Router();

routerLocation.post('/location',handleLocation);
routerLocation.get('/location/:userId/:tripId', getLocation);
routerLocation.get('/location', getAll);
export default routerLocation;
