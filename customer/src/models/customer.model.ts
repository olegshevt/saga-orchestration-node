import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface CustomerAttrs {
  name: string;
  balance: number;
}

interface CustomerDoc extends Document {
  uuid: string;
  name: string;
  balance: number;
}

const customerSchema = new Schema<CustomerDoc>({
  uuid: { type: String, required: true, unique: true, default: uuidv4 },
  name: { type: String, required: true },
  balance: { type: Number, required: true },
});

const Customer = mongoose.model<CustomerDoc>('Customer', customerSchema);

const build = (attrs: CustomerAttrs) => {
  return new Customer(attrs);
};

export { Customer, build };
