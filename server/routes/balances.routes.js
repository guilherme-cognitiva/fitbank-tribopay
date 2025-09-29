import express from 'express';
import { format } from 'date-fns';
import supabase from '../config/database.js';
import { fitbankService } from '../services/fitbank.service.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';
import { balanceRefreshLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Get cached balances
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('account_balances')
      .select(`
        *,
        bank_account:bank_accounts(id, label, type, holder_name)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// Refresh balances manually
router.post('/refresh', authenticateToken, requireAdmin, balanceRefreshLimiter, async (req, res) => {
  try {
    // Get active transactional and fee accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .in('type', ['transactional', 'fee'])
      .eq('is_active', true);

    if (accountsError) throw accountsError;

    const results = [];

    for (const account of accounts) {
      try {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const params = {
          StartDate: format(oneWeekAgo, 'dd/MM/yyyy'),
          EndDate: format(today, 'dd/MM/yyyy'),
          PageSize: 50,
          PageIndex: 0,
          Bank: account.bank,
          BankBranch: account.branch,
          BankAccount: account.account,
          BankAccountDigit: account.digit
        };

        const response = await fitbankService.getAccountEntryPaged(params);

        if (response.Success === 'true' || response.Success === true) {
          // Update or insert balance
          const { error: upsertError } = await supabase
            .from('account_balances')
            .upsert({
              bank_account_id: account.id,
              balance: parseFloat(response.Balance) || 0,
              blocked_balance: parseFloat(response.BlockedBalance) || 0,
              raw_entry_json: response,
              updated_at: new Date().toISOString()
            });

          if (upsertError) throw upsertError;

          results.push({
            accountId: account.id,
            label: account.label,
            balance: parseFloat(response.Balance) || 0,
            success: true
          });
        } else {
          console.error(`Balance refresh failed for ${account.label}:`, response);
          results.push({
            accountId: account.id,
            label: account.label,
            success: false,
            error: response.ErrorDescription || 'Unknown error'
          });
        }
      } catch (error) {
        console.error(`Error refreshing balance for ${account.label}:`, error);
        results.push({
          accountId: account.id,
          label: account.label,
          success: false,
          error: error.message
        });
      }
    }

    await AuditService.log(
      req.user.id,
      'BALANCE_REFRESH',
      'account_balance',
      null,
      req.ip,
      req.get('User-Agent'),
      { results }
    );

    res.json({ success: true, results });
  } catch (error) {
    console.error('Refresh balances error:', error);
    res.status(500).json({ error: 'Failed to refresh balances' });
  }
});

export default router;