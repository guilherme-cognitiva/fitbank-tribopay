import express from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import supabase from '../config/database.js';
import { fitbankService } from '../services/fitbank.service.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';
import { pixOutLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const pixOutSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid().optional(),
  toName: z.string().min(1).optional(),
  toTaxNumber: z.string().optional(),
  toBank: z.string().optional(),
  toBranch: z.string().optional(),
  toAccount: z.string().optional(),
  toAccountDigit: z.string().optional(),
  value: z.number().positive(),
  paymentDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  description: z.string().optional()
});

// Create PIX OUT
router.post('/out', authenticateToken, requireAdmin, pixOutLimiter, async (req, res) => {
  try {
    const pixData = pixOutSchema.parse(req.body);
    const identifier = uuidv4();

    // Get source account
    const { data: fromAccount, error: fromError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', pixData.fromAccountId)
      .eq('is_active', true)
      .single();

    if (fromError) throw fromError;

    let toAccountData = {};

    if (pixData.toAccountId) {
      // Using saved account
      const { data: toAccount, error: toError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', pixData.toAccountId)
        .eq('is_active', true)
        .single();

      if (toError) throw toError;

      toAccountData = {
        ToName: toAccount.holder_name,
        ToTaxNumber: toAccount.tax_number,
        ToBank: toAccount.bank,
        ToBankBranch: toAccount.branch,
        ToBankAccount: toAccount.account,
        ToBankAccountDigit: toAccount.digit,
        AccountType: toAccount.account_type || '0'
      };
    } else {
      // Using provided data
      toAccountData = {
        ToName: pixData.toName,
        ToTaxNumber: pixData.toTaxNumber,
        ToBank: pixData.toBank,
        ToBankBranch: pixData.toBranch,
        ToBankAccount: pixData.toAccount,
        ToBankAccountDigit: pixData.toAccountDigit,
        AccountType: '0'
      };
    }

    const fitbankParams = {
      Bank: fromAccount.bank,
      BankBranch: fromAccount.branch,
      BankAccount: fromAccount.account,
      BankAccountDigit: fromAccount.digit,
      ...toAccountData,
      Value: pixData.value.toString(),
      PaymentDate: pixData.paymentDate,
      Identifier: identifier,
      Description: pixData.description || ''
    };

    const response = await fitbankService.generatePixOut(fitbankParams);

    // Save PIX OUT request
    const { data: pixRequest, error: saveError } = await supabase
      .from('pix_out_requests')
      .insert({
        document_number: response.DocumentNumber,
        identifier: identifier,
        value: pixData.value,
        payment_date: format(new Date(pixData.paymentDate.split('/').reverse().join('-')), 'yyyy-MM-dd'),
        description: pixData.description,
        from_account_id: pixData.fromAccountId,
        to_account_id: pixData.toAccountId || null,
        to_name: toAccountData.ToName,
        to_tax_number: toAccountData.ToTaxNumber,
        to_bank: toAccountData.ToBank,
        to_branch: toAccountData.ToBankBranch,
        to_account: toAccountData.ToBankAccount,
        to_account_digit: toAccountData.ToBankAccountDigit,
        status: response.Success === 'true' ? 'success' : 'failed',
        receipt_url: response.ReceiptUrl,
        raw_response_json: response,
        error_code: response.ErrorCode,
        error_description: response.ErrorDescription,
        created_by: req.user.id
      })
      .select()
      .single();

    if (saveError) throw saveError;

    await AuditService.log(
      req.user.id,
      'PIX_OUT_CREATED',
      'pix_out_request',
      pixRequest.id,
      req.ip,
      req.get('User-Agent'),
      {
        identifier,
        value: pixData.value,
        toAccount: `${toAccountData.ToBank}-****${toAccountData.ToBankAccount.slice(-4)}`,
        success: response.Success === 'true'
      }
    );

    res.status(201).json({
      success: response.Success === 'true',
      data: {
        id: pixRequest.id,
        documentNumber: response.DocumentNumber,
        identifier: identifier,
        receiptUrl: response.ReceiptUrl,
        status: pixRequest.status
      },
      error: response.Success === 'true' ? null : {
        code: response.ErrorCode,
        description: response.ErrorDescription
      }
    });

  } catch (error) {
    console.error('PIX OUT error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid PIX data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create PIX OUT' });
  }
});

// Get PIX OUT status
router.get('/out/:documentNumber/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { documentNumber } = req.params;

    // Get PIX request from database
    const { data: pixRequest, error: dbError } = await supabase
      .from('pix_out_requests')
      .select(`
        *,
        from_account:bank_accounts!from_account_id(*)
      `)
      .eq('document_number', documentNumber)
      .single();

    if (dbError) throw dbError;

    // Query FitBank for current status
    const bankData = {
      bank: pixRequest.from_account.bank,
      branch: pixRequest.from_account.branch,
      account: pixRequest.from_account.account,
      digit: pixRequest.from_account.digit
    };

    const response = await fitbankService.getPixOutById(documentNumber, bankData);

    // Update status in database
    const newStatus = response.Success === 'true' ? 'success' : 'failed';
    const { error: updateError } = await supabase
      .from('pix_out_requests')
      .update({
        status: newStatus,
        raw_response_json: response,
        error_code: response.ErrorCode,
        error_description: response.ErrorDescription
      })
      .eq('document_number', documentNumber);

    if (updateError) throw updateError;

    await AuditService.log(
      req.user.id,
      'PIX_STATUS_CHECKED',
      'pix_out_request',
      pixRequest.id,
      req.ip,
      req.get('User-Agent'),
      { documentNumber, status: newStatus }
    );

    res.json({
      documentNumber,
      identifier: pixRequest.identifier,
      status: newStatus,
      value: pixRequest.value,
      paymentDate: pixRequest.payment_date,
      receiptUrl: response.ReceiptUrl,
      success: response.Success === 'true',
      error: response.Success === 'true' ? null : {
        code: response.ErrorCode,
        description: response.ErrorDescription
      }
    });

  } catch (error) {
    console.error('PIX status error:', error);
    res.status(500).json({ error: 'Failed to get PIX status' });
  }
});

// Get PIX OUT history
router.get('/out', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const { data, error } = await supabase
      .from('pix_out_requests')
      .select(`
        *,
        from_account:bank_accounts!from_account_id(label, holder_name),
        to_account:bank_accounts!to_account_id(label, holder_name)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Mask sensitive data
    const maskedData = data.map(request => ({
      ...request,
      to_account_masked: request.to_account ? `${request.to_bank}-****${request.to_account.slice(-4)}` : null,
      to_tax_number_masked: request.to_tax_number ? `****${request.to_tax_number.slice(-4)}` : null
    }));

    res.json(maskedData);
  } catch (error) {
    console.error('PIX history error:', error);
    res.status(500).json({ error: 'Failed to fetch PIX history' });
  }
});

// Get PIX keys
router.get('/keys/:accountId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { accountId } = req.params;

    const { data: account, error: accountError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('is_active', true)
      .single();

    if (accountError) throw accountError;

    const bankData = {
      bank: account.bank,
      branch: account.branch,
      account: account.account,
      digit: account.digit
    };

    const response = await fitbankService.getPixKeys(bankData);

    await AuditService.log(
      req.user.id,
      'PIX_KEYS_CONSULTED',
      'bank_account',
      accountId,
      req.ip,
      req.get('User-Agent'),
      { accountLabel: account.label }
    );

    res.json({
      success: response.Success === 'true',
      keys: response.Success === 'true' ? response.Keys : [],
      error: response.Success === 'true' ? null : {
        code: response.ErrorCode || 'UNKNOWN_ERROR',
        description: response.ErrorDescription || 'Failed to fetch PIX keys'
      }
    });

  } catch (error) {
    console.error('PIX keys error:', error);
    res.status(500).json({ error: 'Failed to fetch PIX keys' });
  }
});

export default router;