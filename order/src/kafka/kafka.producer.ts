import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'shared-producer', brokers: ['kafka:9092'] });
const producer = kafka.producer();

const initializeProducer = async () => {
  try {
    await producer.connect();
  } catch (error) {
    console.error('Failed to connect producer:', error);
  }
}

const sendMessage = async (topic: any, message: any) => {
  try {
    await producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

export { initializeProducer, sendMessage, producer };
