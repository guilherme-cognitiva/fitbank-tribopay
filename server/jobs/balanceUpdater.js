import cron from 'node-cron';
import { format } from 'date-fns';
import supabase from '../config/database.js';
import { fitbankService } from '../services/fitbank.service.js';

class BalanceUpdater {
  constructor() {
    this.isRunning = false;
  }

  async updateBalances() {
    if (this.isRunning) {
      console.log('Balance update already running, skipping...');
      return;
    }

    // Check if Supabase is configured
    if (!process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL.includes('your-project-id')) {
      console.log('⏭️  Skipping balance update - Supabase not configured');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting scheduled balance update...');

    try {
      // Get active transactional and fee accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('*')
        .in('type', ['transactional', 'fee'])
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      let successCount = 0;
      let errorCount = 0;

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

            console.log(`✅ Updated balance for ${account.label}: R$ ${response.Balance}`);
            successCount++;
          } else {
            console.error(`❌ Balance update failed for ${account.label}:`, response.ErrorDescription);
            errorCount++;
          }

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Error updating balance for ${account.label}:`, error.message);
          errorCount++;
        }
      }

      console.log(`🔄 Balance update completed: ${successCount} success, ${errorCount} errors`);

    } catch (error) {
      console.error('❌ Balance update job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.updateBalances();
    });

    console.log('⏰ Balance updater job scheduled (every 30 minutes)');

    // Run once on startup (after 30 seconds delay)
    setTimeout(() => {
      this.updateBalances();
    }, 30000);
  }
}

export const balanceUpdater = new BalanceUpdater();