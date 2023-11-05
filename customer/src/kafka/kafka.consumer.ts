import { Kafka } from 'kafkajs';
import { Customer } from '../models/customer.model';
import { OrderStatus} from '../types'

const kafka = new Kafka({ clientId: 'customer-service', brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'customer-service-group' });
const producer = kafka.producer();

const runConsumer = async () => {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: 'reserve-credit', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        console.error('Kafka message value is null');
        return;
      }
      
      const { orderId, customer_uuid, amount } = JSON.parse(message.value.toString());

      const customer = await Customer.findOne({uuid: customer_uuid});

      let status;
      if (customer && customer.balance >= amount) {
        customer.balance -= amount;
        await customer.save();
        status = OrderStatus.PENDING;
      } else {
        status = customer ? OrderStatus.FAILED : `Customer ${customer_uuid} not found`;
        if(!customer){
          console.log('ERROR')
        } else {
          await customer.save();
        }
      }

      await producer.send({
        topic: 'order-events',
        messages: [{ value: JSON.stringify({ orderId, status }) }],
      });
    },
  });
};

export { runConsumer };
