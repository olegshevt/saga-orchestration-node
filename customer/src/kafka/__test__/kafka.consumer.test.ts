import { Kafka, Consumer, Producer } from 'kafkajs';
import { Customer } from '../../models/customer.model';
import { runConsumer } from '../kafka.consumer';
import { OrderStatus} from '../../types';

jest.mock('../../models/customer.model');

  jest.mock('kafkajs', () => {
    const mockConsumer: Partial<Consumer> = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
    };
  
    const mockProducer: Partial<Producer> = {
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
    };
  
    return {
      Kafka: jest.fn(() => ({
        consumer: jest.fn(() => mockConsumer),
        producer: jest.fn(() => mockProducer),
      })),
    };
  });
  
  describe('Kafka Consumer', () => {
    const mockConsumer = new Kafka({ clientId: '', brokers: [''] }).consumer({ groupId: '' });
    const mockProducer = new Kafka({ clientId: '', brokers: [''] }).producer();
  
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });

    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should process messages and update customer balance', async () => {
      const customerUUID = 'uuid-123';
      const mockCustomer = { uuid: customerUUID, balance: 100, save: jest.fn() };
      (Customer.findOne as jest.Mock).mockResolvedValue(mockCustomer);
  
      const mockMessage = {
        value: Buffer.from(JSON.stringify({ orderId: '123', customer_uuid: customerUUID, amount: 50 })),
      };
  
      (mockConsumer.run as jest.Mock).mockImplementation(async ({ eachMessage }) => {
        await eachMessage({ topic: 'reserve-credit', partition: 0, message: mockMessage });
      });

      (mockProducer.connect as jest.Mock).mockResolvedValue(undefined);
      (mockProducer.send as jest.Mock).mockResolvedValue(undefined);
  
      await runConsumer();
  
      expect(Customer.findOne).toHaveBeenCalledWith({ uuid: customerUUID });
      expect(mockCustomer.balance).toBe(50);
      expect(mockCustomer.save).toHaveBeenCalled();
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'order-events',
        messages: [{ value: JSON.stringify({ orderId: '123', status: OrderStatus.PENDING }) }],
      });
    });
  
    it('should not update balance for a non-existing customer', async () => {
        (Customer.findOne as jest.Mock).mockResolvedValue(null);
        const mockMessage = {
          value: Buffer.from(JSON.stringify({ orderId: '123', customer_uuid: 'non-existing-uuid', amount: 50 })),
        };
        
        (mockConsumer.run as jest.Mock).mockImplementation(async ({ eachMessage }) => {
          await eachMessage({ topic: 'reserve-credit', partition: 0, message: mockMessage });
        });
    
        await runConsumer();
    
        expect(Customer.findOne).toHaveBeenCalledWith({ uuid: 'non-existing-uuid' });
        expect(mockProducer.send).toHaveBeenCalledWith({
            topic: 'order-events',
            messages: [{ value: JSON.stringify({ orderId: '123', status: 'Customer non-existing-uuid not found' }) }],
          });
      });
    
  });