import { Kafka, Consumer } from 'kafkajs';
import { Order} from '../../models/order.model';
import { runConsumer } from '../kafka.consumer';

jest.mock('../../models/order.model', () => ({
    Order: {
      findById: jest.fn(),
    },
  }));
  
  jest.mock('kafkajs', () => {
    const mockConsumer: Partial<Consumer> = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
    };
  
    return {
      Kafka: jest.fn(() => ({
        consumer: jest.fn(() => mockConsumer),
      })),
    };
  });
  
  describe('Kafka Consumer', () => {
    const mockConsumer = new Kafka({ clientId: '', brokers: [''] }).consumer({ groupId: '' });
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should process valid messages correctly', async () => {
      const mockMessage = { value: Buffer.from(JSON.stringify({ orderId: '123', status: 'completed' })) };
      const mockOrder = { status: '', save: jest.fn() };
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
  
      (mockConsumer.run as jest.Mock).mockImplementation(async ({ eachMessage }) => {
        await eachMessage({ topic: 'order-events', partition: 0, message: mockMessage });
      });
  
      await runConsumer();
  
      expect(Order.findById).toHaveBeenCalledWith('123');
      expect(mockOrder.status).toBe('completed');
      expect(mockOrder.save).toHaveBeenCalled();
    });
  
    it('should log an error when message value is null', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
      (mockConsumer.run as jest.Mock).mockImplementation(async ({ eachMessage }) => {
        await eachMessage({ topic: 'order-events', partition: 0, message: { value: null } });
      });
  
      await runConsumer();
  
      expect(consoleErrorSpy).toHaveBeenCalledWith('Kafka message value is null');
      consoleErrorSpy.mockRestore();
    });
  
    it('should log an error when the order is not found', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (Order.findById as jest.Mock).mockResolvedValue(null);
  
      const mockMessage = { value: Buffer.from(JSON.stringify({ orderId: 'unknown', status: 'completed' })) };
  
      (mockConsumer.run as jest.Mock).mockImplementation(async ({ eachMessage }) => {
        await eachMessage({ topic: 'order-events', partition: 0, message: mockMessage });
      });
  
      await runConsumer();
  
      expect(consoleErrorSpy).toHaveBeenCalledWith('Order unknown not found');
      consoleErrorSpy.mockRestore();
    });
  
    it('should handle a message with a new order status', async () => {
      const orderId = '123';
      const newStatus = 'shipped';
      const mockMessage = { value: Buffer.from(JSON.stringify({ orderId, status: newStatus })) };
      const mockOrder = { status: 'pending', save: jest.fn() };
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
    
      (mockConsumer.run as jest.Mock).mockImplementation(async ({ eachMessage }) => {
        await eachMessage({ topic: 'order-events', partition: 0, message: mockMessage });
      });
    
      await runConsumer();
    
      expect(Order.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrder.status).toBe(newStatus);
      expect(mockOrder.save).toHaveBeenCalled();
    });

  });

