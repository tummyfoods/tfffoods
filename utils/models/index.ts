// Import all models in the correct order to ensure proper registration
import "./Product";
import "./User";
import "./Brand";
import "./Category";
import "./DeliverySettings";
import "./Order";
import "./Invoice";
import "./InvoiceCounter";

// Export a function to ensure models are registered
export function ensureModelsAreRegistered() {
  // This function doesn't need to do anything
  // Just importing the models above is enough to register them
  return;
}

// Also export individual models for direct use
import User from "./User";
import Product from "./Product";
import { Order } from "./Order";
import Invoice from "./Invoice";
import InvoiceCounter from "./InvoiceCounter";

export { User, Product, Order, Invoice, InvoiceCounter };
