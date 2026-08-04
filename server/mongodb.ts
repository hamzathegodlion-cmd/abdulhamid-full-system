import mongoose from 'mongoose';

/**
 * Utility to establish connection to MongoDB if MONGODB_URI or MONGO_URI environment variable is provided.
 * Falls back gracefully if no connection string is set or if connection fails.
 */
export async function connectMongoDB(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.log('[MongoDB] MONGODB_URI environment variable is not set. Using local file storage engine.');
    return false;
  }

  try {
    console.log('[MongoDB] Attempting connection to MongoDB database...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[MongoDB] Successfully connected to MongoDB database!');
    return true;
  } catch (err: any) {
    console.error('[MongoDB] Connection error:', err.message || err);
    console.log('[MongoDB] Continuing with local storage fallback.');
    return false;
  }
}

// Mongoose Schemas for SmartPOS Entities
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: String,
  role: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: String,
  categoryId: String,
  unitId: String,
  costPrice: Number,
  sellingPrice: Number,
  currentStock: Number,
  minStockLevel: Number,
  supplierId: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const SaleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  cashierId: String,
  cashierName: String,
  customerId: String,
  customerName: String,
  totalAmount: Number,
  discountAmount: Number,
  taxAmount: Number,
  netAmount: Number,
  paymentMethod: String,
  paymentStatus: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoProduct = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const MongoSale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
