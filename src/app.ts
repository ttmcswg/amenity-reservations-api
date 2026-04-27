import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import amenitiesRouter from './modules/amenities/amenityReservations.routes';
import userReservationsRouter from './modules/reservations/userReservations.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(amenitiesRouter);
app.use(userReservationsRouter);

export default app;
