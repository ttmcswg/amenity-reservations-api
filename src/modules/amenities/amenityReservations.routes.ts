import { Router } from 'express';
import { getAmenityReservations } from './amenityReservations.controller';

const amenitiesRouter = Router();

amenitiesRouter.get('/amenities/:id/reservations', getAmenityReservations);

export default amenitiesRouter;
