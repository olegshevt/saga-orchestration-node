import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import { Order, OrderStatus } from '../../models/order.model';

jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn(() => ({
      producer: jest.fn(() => ({
        connect: jest.fn(),
        send: jest.fn(),
        disconnect: jest.fn(),
      })),
      consumer: jest.fn(() => ({
        connect: jest.fn(),
        subscribe: jest.fn(),
        run: jest.fn(),
      })),
    })),
  };
});

let mongoServer: MongoMemoryServer;
const validUUID = '123e4567-e89b-12d3-a456-426614174000';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Order Service', () => {
  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/orders')
        .send({ customer_uuid: validUUID, amount: 100 });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('uuid');
      expect(res.body.customer_uuid).toBe(validUUID);
      expect(res.body.amount).toBe(100);
    });

    it('should return 400 for missing customer_uuid', async () => {
      const res = await request(app)
        .post('/orders')
        .send({ amount: 100 });
      expect(res.status).toBe(400);
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'customer_uuid must be a valid UUID.'
        })
      );
    });

    it('should return 400 for missing amount', async () => {
      const res = await request(app)
        .post('/orders')
        .send({ customer_uuid: 'test-customer' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'customer_uuid must be a valid UUID.'
        })
      );
    });
  });

  describe('GET /orders/:order_uuid/status', () => {
    it('should get the status of an order', async () => {
      const order = new Order({ customer_uuid: validUUID, amount: 100, status: OrderStatus.PENDING });
      await order.save();

      const res = await request(app)
        .get(`/orders/${order.uuid}/status`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(OrderStatus.PENDING);
    });

    it('should return 404 if order not found', async () => {
      const res = await request(app)
        .get('/orders/random-id/status');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Order not found');
    });
  });
});


