import { AuthService } from '../services/auth.service.js';
import supabase from '../config/database.js';
import { DEFAULT_ACCOUNTS } from '../config/fitbank.js';

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@fitbank.com')
      .single();

    if (existingUser) {
      console.log('✅ Admin user already exists');
      return existingUser;
    }

    // Create admin user
    const passwordHash = await AuthService.hashPassword('admin123');
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: 'admin@fitbank.com',
        password_hash: passwordHash,
        role: 'admin'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@fitbank.com');
    console.log('🔑 Password: admin123');
    
    return user;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function createDefaultAccounts(adminUserId) {
  try {
    const accounts = [
      {
        label: 'Conta Transacional',
        type: 'transactional',
        bank: DEFAULT_ACCOUNTS.transactional.bank,
        branch: DEFAULT_ACCOUNTS.transactional.branch,
        account: DEFAULT_ACCOUNTS.transactional.account,
        digit: DEFAULT_ACCOUNTS.transactional.digit,
        holder_name: DEFAULT_ACCOUNTS.transactional.name,
        created_by: adminUserId
      },
      {
        label: 'Conta de Taxa',
        type: 'fee',
        bank: DEFAULT_ACCOUNTS.fee.bank,
        branch: DEFAULT_ACCOUNTS.fee.branch,
        account: DEFAULT_ACCOUNTS.fee.account,
        digit: DEFAULT_ACCOUNTS.fee.digit,
        tax_number: DEFAULT_ACCOUNTS.fee.taxNumber,
        holder_name: DEFAULT_ACCOUNTS.fee.name,
        created_by: adminUserId
      }
    ];

    for (const accountData of accounts) {
      const { data: existingAccount } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('type', accountData.type)
        .eq('is_active', true)
        .single();

      if (existingAccount) {
        console.log(`✅ ${accountData.label} already exists`);
        continue;
      }

      const { data: account, error } = await supabase
        .from('bank_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Created ${accountData.label}`);
    }

  } catch (error) {
    console.error('❌ Error creating default accounts:', error);
    throw error;
  }
}

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    const adminUser = await createAdminUser();
    await createDefaultAccounts(adminUser.id);

    console.log('🌱 Database seed completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('📧 Email: admin@fitbank.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  Remember to change the password after first login!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();