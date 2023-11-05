import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

interface OrderAttrs {
  customer_uuid: string;
  status: OrderStatus;
  amount: number;
}

interface OrderDoc extends Document {
  uuid: string;
  customer_uuid: string;
  status: OrderStatus;
  amount: number;
}

const orderSchema = new Schema<OrderDoc>({
  uuid: { type: String, required: true, unique: true, default: uuidv4 },
  customer_uuid: { type: String, required: true },
  status: { type: String, required: true, enum: Object.values(OrderStatus) },
  amount: { type: Number, required: true },
});

const Order = mongoose.model<OrderDoc>('Order', orderSchema);

const build = (attrs: OrderAttrs) => {
  return new Order(attrs);
};

export { Order, build };
