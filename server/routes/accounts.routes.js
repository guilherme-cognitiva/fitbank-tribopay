import express from 'express';
import { z } from 'zod';
import supabase from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';

const router = express.Router();

const accountSchema = z.object({
  label: z.string().min(1),
  type: z.enum(['transactional', 'fee', 'receiving']),
  bank: z.string().min(1),
  branch: z.string().min(1),
  account: z.string().min(1),
  digit: z.string().min(1),
  tax_number: z.string().optional(),
  holder_name: z.string().min(1),
  account_type: z.string().default('0')
});

// Get all bank accounts
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true });

    if (error) throw error;

    // Mask sensitive data
    const maskedData = data.map(account => ({
      ...account,
      account: `****${account.account.slice(-4)}`,
      tax_number: account.tax_number ? `****${account.tax_number.slice(-4)}` : null
    }));

    res.json(maskedData);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get single account (full data for editing)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Create bank account
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const accountData = accountSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        ...accountData,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    await AuditService.log(
      req.user.id,
      'ACCOUNT_CREATED',
      'bank_account',
      data.id,
      req.ip,
      req.get('User-Agent'),
      { type: accountData.type, label: accountData.label }
    );

    res.status(201).json(data);
  } catch (error) {
    console.error('Create account error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid account data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update bank account
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const accountData = accountSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .update(accountData)
      .eq('id', req.params.id)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log(
      req.user.id,
      'ACCOUNT_UPDATED',
      'bank_account',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { type: accountData.type, label: accountData.label }
    );

    res.json(data);
  } catch (error) {
    console.error('Update account error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid account data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Soft delete bank account
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log(
      req.user.id,
      'ACCOUNT_DELETED',
      'bank_account',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { label: data.label }
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;