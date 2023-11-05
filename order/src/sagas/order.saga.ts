import { build, OrderStatus } from '../models/order.model';
import { sendMessage } from '../kafka/kafka.producer';

export const createOrderSaga = async (customer_uuid: string, amount: number) => {
  try {
    const order = build({ customer_uuid, status: OrderStatus.PENDING, amount });
    await order.save();

    await sendMessage('reserve-credit', { orderId: order.id, customer_uuid, amount });
    console.log('Credit reservation command sent');

    return order;
  } catch (err) {
    throw err;
  }
};
