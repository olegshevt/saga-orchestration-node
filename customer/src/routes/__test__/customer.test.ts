jest.mock('kafkajs', () => {
    return {
      Kafka: jest.fn().mockImplementation(() => {
        return {
          producer: jest.fn().mockImplementation(() => {
            return {
              connect: jest.fn().mockResolvedValue(true),
              send: jest.fn().mockResolvedValue(true),
              disconnect: jest.fn().mockResolvedValue(true),
            };
          }),
          consumer: jest.fn().mockImplementation(() => {
            return {
              connect: jest.fn().mockResolvedValue(true),
              subscribe: jest.fn().mockResolvedValue(true),
              run: jest.fn().mockResolvedValue(true),
              disconnect: jest.fn().mockResolvedValue(true),
            };
          }),
        };
      }),
    };
  });

import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

beforeEach(() => {
    jest.resetModules();
  });

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Customer Service Tests', () => {

    describe('POST /customers', () => {
        
        it('should create a new customer and return 201 status', async () => {
            const response = await request(app)
                .post('/customers')
                .send({ name: "John Doe", balance: 1000 });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('name', 'John Doe');
        });

        it('should throw an error if name or balance is missing', async () => {
            const response = await request(app)
                .post('/customers')
                .send({ name: "John Doe" });
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toContainEqual(
              expect.objectContaining({
                msg: 'Balance must be a positive number'
              })
            );
        });

        it('should return a 404 if the customer does not exist', async () => {
            const response = await request(app)
                .get('/customers/invalid_customer_id');
          
            expect(response.status).toBe(404);
          });

          it('should not create a customer with invalid input', async () => {
            const response = await request(app)
                .post('/customers')
                .send({ name: "", balance: -100 });
          
            expect(response.status).toBe(400);
            expect(response.body.errors).toContainEqual(
              expect.objectContaining({
                msg: 'Balance must be a positive number'
              })
            );
          });
    });
});
