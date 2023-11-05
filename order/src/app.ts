import express from 'express';
import orderRouter from './routes/order';
import { initializeProducer } from "./kafka/kafka.producer";

const app = express();
app.use(express.json());
initializeProducer();

app.use('/orders', orderRouter);

export default app;