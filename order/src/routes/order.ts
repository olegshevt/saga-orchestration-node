import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, param } from 'express-validator';
import { createOrderSaga } from '../sagas/order.saga';
import { Order } from '../models/order.model';
import handleErrors from '../middlewares/errorHandler';

const router = express.Router();

router.post('/', [
    body('customer_uuid').isUUID().withMessage('customer_uuid must be a valid UUID.'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number.')
], async (req: Request, res: Response, next: NextFunction) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { customer_uuid, amount } = req.body;
        const order = await createOrderSaga(customer_uuid, amount);
        res.status(201).send(order);
    } catch (error) {
        next(error);
    }
});

router.get('/:order_uuid/status', param('order_uuid').isUUID().withMessage('order_uuid must be a valid UUID'),
async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findOne({ uuid: req.params.order_uuid });
        if (!order) {
            return res.status(404).send({ message: 'Order not found' });
        }
        res.status(200).send({ status: order.status });
    } catch (error) {
        next(error);
    }
});

router.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).send({ message: 'Order not found' });
});

router.use(handleErrors);

export default router;
