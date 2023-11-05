import mongoose from 'mongoose';
import { runConsumer } from './kafka/kafka.consumer';
import app from './app';

const start = async () => {
  try {
    const MONGO_URI = process.env.MONGO_ORDER_URI as string;

    await mongoose.connect(MONGO_URI);
    
    console.log('Connected to MongoDB');
    runConsumer();
    app.listen(3000, () => {
      console.log('Orders Service listening on port 3000');
    });
  } catch (err) {
    console.error('Failed to start:', err);
  }
};

start();
