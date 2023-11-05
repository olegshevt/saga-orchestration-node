import { Kafka } from 'kafkajs';
import { Order } from '../models/order.model';

const kafka = new Kafka({ clientId: 'order-service', brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'order-service-group' });

const runConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({ topic: 'order-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        console.error('Kafka message value is null');
        return;
      }

      const { orderId, status } = JSON.parse(message.value.toString());
      const order = await Order.findById(orderId);
      if (order) {
        order.status = status;
        await order.save();
      } else {
        console.error(`Order ${orderId} not found`);
      }
    },
  });
};

export { runConsumer };