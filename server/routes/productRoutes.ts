import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { Product, UserRole } from '../types';

const router = Router();

// Configure Multer for image uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `prod-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET /api/products
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { query, categoryId, supplierId, status } = req.query;
  let products = db.getProducts();

  if (query) {
    const q = (query as string).toLowerCase().trim();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }

  if (categoryId) {
    products = products.filter(p => p.categoryId === categoryId);
  }

  if (supplierId) {
    products = products.filter(p => p.supplierId === supplierId);
  }

  if (status) {
    if (status === 'active') products = products.filter(p => p.isActive);
    if (status === 'inactive') products = products.filter(p => !p.isActive);
    if (status === 'low_stock') products = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
    if (status === 'out_of_stock') products = products.filter(p => p.currentStock <= 0);
  }

  return res.json(products);
});

// GET /api/products/search/barcode/:barcode
router.get('/search/barcode/:barcode', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { barcode } = req.params;
  const product = db.getProductByBarcode(barcode);
  if (!product) {
    return res.status(404).json({ error: `No product found with barcode ${barcode}` });
  }
  return res.json(product);
});

// GET /api/products/:id
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
});

// POST /api/products/upload-image
router.post('/upload-image', authenticateToken, requireRole(UserRole.MANAGER), upload.single('image'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const relativeUrl = `/uploads/products/${req.file.filename}`;
  return res.json({ imageUrl: relativeUrl });
});

// POST /api/products (Manager only)
router.post('/', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name, barcode, sku, categoryId, supplierId,
      buyingPrice, sellingPrice, currentStock, minStock, maxStock,
      unitId, description, imageUrl, isActive
    } = req.body;

    if (!name || !barcode || !sku || !categoryId || !unitId) {
      return res.status(400).json({ error: 'Name, Barcode, SKU, Category, and Unit are required' });
    }

    if (db.getProductByBarcode(barcode)) {
      return res.status(400).json({ error: `Barcode "${barcode}" is already assigned to another product` });
    }

    if (db.getProductBySKU(sku)) {
      return res.status(400).json({ error: `SKU "${sku}" is already assigned to another product` });
    }

    const isoNow = new Date().toISOString();
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      barcode,
      sku: sku.toUpperCase(),
      categoryId,
      supplierId: supplierId || undefined,
      buyingPrice: Number(buyingPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      currentStock: Number(currentStock) || 0,
      minStock: Number(minStock) || 0,
      maxStock: maxStock ? Number(maxStock) : undefined,
      unitId,
      description: description || '',
      imageUrl: imageUrl || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: isoNow,
      createdBy: req.user?.userId
    };

    const created = db.createProduct(newProduct);

    db.addAuditLog({
      userId: req.user?.userId,
      userName: req.user?.fullName,
      action: 'CreateProduct',
      entity: 'Product',
      entityId: created.id,
      newValues: JSON.stringify(created),
      ipAddress: req.ip
    });

    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id (Manager only)
router.put('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getProductById(id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { barcode, sku } = req.body;
    if (barcode && barcode !== existing.barcode) {
      const other = db.getProductByBarcode(barcode);
      if (other && other.id !== id) {
        return res.status(400).json({ error: `Barcode "${barcode}" is already taken` });
      }
    }

    if (sku && sku !== existing.sku) {
      const other = db.getProductBySKU(sku);
      if (other && other.id !== id) {
        return res.status(400).json({ error: `SKU "${sku}" is already taken` });
      }
    }

    const updated = db.updateProduct(id, {
      ...req.body,
      buyingPrice: req.body.buyingPrice !== undefined ? Number(req.body.buyingPrice) : existing.buyingPrice,
      sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : existing.sellingPrice,
      currentStock: req.body.currentStock !== undefined ? Number(req.body.currentStock) : existing.currentStock,
      minStock: req.body.minStock !== undefined ? Number(req.body.minStock) : existing.minStock,
      updatedBy: req.user?.userId
    });

    db.addAuditLog({
      userId: req.user?.userId,
      userName: req.user?.fullName,
      action: 'UpdateProduct',
      entity: 'Product',
      entityId: id,
      oldValues: JSON.stringify(existing),
      newValues: JSON.stringify(updated),
      ipAddress: req.ip
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id (Manager only)
router.delete('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getProductById(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db.deleteProduct(id);

  db.addAuditLog({
    userId: req.user?.userId,
    userName: req.user?.fullName,
    action: 'SoftDeleteProduct',
    entity: 'Product',
    entityId: id,
    oldValues: JSON.stringify(existing),
    ipAddress: req.ip
  });

  return res.json({ message: 'Product deleted successfully' });
});

export default router;
