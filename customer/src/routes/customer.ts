import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { build } from '../models/customer.model';
import handleErrors from '../middlewares/errorHandler';

const router = express.Router();

const validateCustomer = [
    body('name', 'Name is required').not().isEmpty(),
    body('balance', 'Balance must be a positive number').isFloat({ gt: 0 })
  ];
  
  router.post('/', validateCustomer, async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { name, balance } = req.body as { name: string; balance: number };
    
    try {
      const customer = build({ name, balance });
      await customer.save();
      res.status(201).send(customer);
    } catch (error) {
      next(error); 
    }
  });

  router.use(handleErrors);
  
  export default router;
