import { Router } from 'express';
import { getUserReservations } from './userReservations.controller';

const userReservationsRouter = Router();

userReservationsRouter.get('/users/:id/reservations', getUserReservations);

export default userReservationsRouter;
