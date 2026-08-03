import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware';
import { Customer } from '../types';

const router = Router();

// GET /api/customers
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { search } = req.query;
  let customers = db.getCustomers();

  if (search) {
    const q = (search as string).toLowerCase();
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }

  return res.json(customers);
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const cust = db.getCustomerById(req.params.id);
  if (!cust) return res.status(404).json({ error: 'Customer not found' });
  return res.json(cust);
});

// GET /api/customers/:id/history
router.get('/:id/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const cust = db.getCustomerById(req.params.id);
  if (!cust) return res.status(404).json({ error: 'Customer not found' });

  const sales = db.getSales().filter(s => s.customerId === req.params.id);
  return res.json({ customer: cust, sales });
});

// POST /api/customers
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Customer name is required' });

  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name,
    phone: phone || '',
    email: email || '',
    address: address || '',
    totalSpent: 0,
    createdAt: new Date().toISOString()
  };

  const created = db.createCustomer(newCustomer);
  return res.status(201).json(created);
});

// PUT /api/customers/:id
router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateCustomer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Customer not found' });
  return res.json(updated);
});

// DELETE /api/customers/:id
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteCustomer(req.params.id);
  if (!success) return res.status(404).json({ error: 'Customer not found' });
  return res.json({ message: 'Customer deleted successfully' });
});

export default router;
