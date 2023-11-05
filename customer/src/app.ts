import express from 'express';
import customerRouter from './routes/customer';
import { initializeProducer } from "./kafka/kafka.producer";

const app = express();
app.use(express.json());
initializeProducer();

app.use('/customers', customerRouter);

export default app;
