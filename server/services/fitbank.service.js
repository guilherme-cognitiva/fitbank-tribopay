import { FITBANK_CONFIG } from '../config/fitbank.js';

export class FitBankService {
  constructor() {
    this.apiUrl = FITBANK_CONFIG.apiUrl;
    this.credentials = Buffer.from(`${FITBANK_CONFIG.user}:${FITBANK_CONFIG.password}`).toString('base64');
  }

  async makeRequest(payload) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`FitBank API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FitBank API Error:', error);
      throw error;
    }
  }

  async generatePixOut(params) {
    const payload = {
      Method: 'GeneratePixOut',
      PartnerId: FITBANK_CONFIG.partnerId,
      BusinessUnitId: FITBANK_CONFIG.businessUnitId,
      TaxNumber: FITBANK_CONFIG.taxNumber,
      ...params
    };

    return await this.makeRequest(payload);
  }

  async getPixOutById(documentNumber, bankData) {
    const payload = {
      Method: 'GetPixOutById',
      PartnerId: FITBANK_CONFIG.partnerId,
      BusinessUnitId: FITBANK_CONFIG.businessUnitId,
      TaxNumber: FITBANK_CONFIG.taxNumber,
      Bank: bankData.bank,
      BankBranch: bankData.branch,
      BankAccount: bankData.account,
      BankAccountDigit: bankData.digit,
      DocumentNumber: documentNumber
    };

    return await this.makeRequest(payload);
  }

  async getAccountEntryPaged(params) {
    const payload = {
      Method: 'GetAccountEntryPaged',
      PartnerId: FITBANK_CONFIG.partnerId,
      BusinessUnitId: FITBANK_CONFIG.businessUnitId,
      TaxNumber: FITBANK_CONFIG.taxNumber,
      ...params
    };

    return await this.makeRequest(payload);
  }

  async getPixKeys(bankData) {
    const payload = {
      Method: 'GetPixKeys',
      PartnerId: FITBANK_CONFIG.partnerId,
      BusinessUnitId: FITBANK_CONFIG.businessUnitId,
      TaxNumber: FITBANK_CONFIG.taxNumber,
      Bank: bankData.bank,
      BankBranch: bankData.branch,
      BankAccount: bankData.account,
      BankAccountDigit: bankData.digit
    };

    return await this.makeRequest(payload);
  }
}

export const fitbankService = new FitBankService();