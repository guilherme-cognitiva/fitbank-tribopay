export const FITBANK_CONFIG = {
  apiUrl: process.env.FITBANK_API_URL || 'https://apiv2.fitbank.com.br/main/execute',
  user: process.env.FITBANK_USER,
  password: process.env.FITBANK_PASSWORD,
  partnerId: process.env.FITBANK_PARTNER_ID || '1001940',
  businessUnitId: process.env.FITBANK_BUSINESS_UNIT_ID || '1001823',
  taxNumber: process.env.FITBANK_TAX_NUMBER || '53302781000135'
};

export const DEFAULT_ACCOUNTS = {
  transactional: {
    bank: process.env.FITBANK_FROM_BANK || '450',
    branch: process.env.FITBANK_FROM_BRANCH || '0001',
    account: process.env.FITBANK_FROM_ACCOUNT || '9342213115',
    digit: process.env.FITBANK_FROM_ACCOUNT_DIGIT || '2',
    name: process.env.FITBANK_FROM_NAME || 'TRIBOPAY'
  },
  fee: {
    bank: process.env.FEE_BANK || '208',
    branch: process.env.FEE_BRANCH || '0050',
    account: process.env.FEE_ACCOUNT || '528218',
    digit: process.env.FEE_ACCOUNT_DIGIT || '0',
    name: process.env.FEE_NAME || 'TriboPay',
    taxNumber: process.env.FEE_TAX_NUMBER || '53302781000135'
  }
};

if (!FITBANK_CONFIG.user || !FITBANK_CONFIG.password) {
  console.warn('⚠️  FitBank credentials not configured. Please set FITBANK_USER and FITBANK_PASSWORD environment variables.');
}