import { producer, sendMessage } from '../kafka.producer';

jest.mock('kafkajs', () => {
  const actualKafkaJs = jest.requireActual('kafkajs');
  return {
    Kafka: jest.fn(() => ({
      producer: jest.fn(() => ({
        send: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    })),
  };
});

describe('sendMessage', () => {
  it('sends a message to the correct topic', async () => {
    const testTopic = 'test-topic';
    const testMessage = { key: 'value' };
    await sendMessage(testTopic, testMessage);

    expect(producer.send).toHaveBeenCalledWith({
      topic: testTopic,
      messages: [{ value: JSON.stringify(testMessage) }],
    });
  });

  it('sends different data types', async () => {
    const testMessage = 100;
    await sendMessage('test-topic', testMessage);
    
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'test-topic',
      messages: [{ value: JSON.stringify(testMessage) }],
    });
  });

  it('allows sending a null message', async () => {
    await sendMessage('test-topic', null);

    expect(producer.send).toHaveBeenCalledWith({
      topic: 'test-topic',
      messages: [{ value: 'null' }],
    });
  });
});
