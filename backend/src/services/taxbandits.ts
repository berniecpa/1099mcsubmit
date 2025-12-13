import axios, { AxiosInstance } from 'axios';
import { Form1099, FormType, Business, Recipient } from '@prisma/client';

interface TaxBanditsConfig {
  apiUrl: string;
  userToken: string;
  clientId: string;
  clientSecret: string;
}

interface TaxBanditsAuthResponse {
  StatusCode: number;
  StatusName: string;
  StatusMessage: string;
  AccessToken: string;
  TokenType: string;
  ExpiresIn: number;
}

interface Form1099NECRequest {
  SubmissionManifest: {
    TaxYear: number;
    IsFederalFiling: boolean;
    IsStateFiling: boolean;
    IsPostal: boolean;
    IsOnlineAccess: boolean;
  };
  ReturnHeader: {
    Business: {
      BusinessNm: string;
      EIN: string;
      BusinessType: string;
      IsEIN: boolean;
      Email: string;
      Fax: string;
      PhoneNum: string;
      USAddress: {
        Address1: string;
        City: string;
        State: string;
        ZipCd: string;
      };
    };
  };
  ReturnData: Array<{
    SequenceId: string;
    Recipient: {
      Name: string;
      TIN: string;
      IsTIN: boolean;
      Email: string;
      Address: {
        Address1: string;
        City: string;
        State: string;
        ZipCd: string;
      };
    };
    NECFormData: {
      B1NonemployeeComp: number;
      IsFATCA: boolean;
    };
  }>;
}

export class TaxBanditsService {
  private config: TaxBanditsConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.config = {
      apiUrl: process.env.TAXBANDITS_API_URL || 'https://testtbs.com/tbsapi',
      userToken: process.env.TAXBANDITS_USER_TOKEN || '',
      clientId: process.env.TAXBANDITS_CLIENT_ID || '',
      clientSecret: process.env.TAXBANDITS_CLIENT_SECRET || ''
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.client.post<TaxBanditsAuthResponse>('/Auth/Login', {
        UserToken: this.config.userToken,
        ClientId: this.config.clientId,
        ClientSecret: this.config.clientSecret
      });

      if (response.data.StatusCode !== 200) {
        throw new Error(`TaxBandits auth failed: ${response.data.StatusMessage}`);
      }

      this.accessToken = response.data.AccessToken;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.ExpiresIn - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('TaxBandits authentication error:', error);
      throw new Error('Failed to authenticate with TaxBandits');
    }
  }

  private formatAmount(cents: number | null): number {
    // TaxBandits expects amounts in dollars
    if (!cents) return 0;
    return cents / 100;
  }

  async submitForm1099NEC(
    form: Form1099,
    business: Business,
    recipient: Recipient
  ): Promise<{ submissionId: string; recordId: string }> {
    const accessToken = await this.getAccessToken();

    const requestData: Form1099NECRequest = {
      SubmissionManifest: {
        TaxYear: form.taxYear,
        IsFederalFiling: true,
        IsStateFiling: false,
        IsPostal: false,
        IsOnlineAccess: true
      },
      ReturnHeader: {
        Business: {
          BusinessNm: business.businessName,
          EIN: business.ein,
          BusinessType: 'ESTE', // Update based on actual business type
          IsEIN: true,
          Email: '', // Add email to business model if needed
          Fax: '',
          PhoneNum: business.phone,
          USAddress: {
            Address1: business.address,
            City: business.city,
            State: business.state,
            ZipCd: business.zipCode
          }
        }
      },
      ReturnData: [
        {
          SequenceId: form.id,
          Recipient: {
            Name: recipient.name,
            TIN: recipient.tin,
            IsTIN: recipient.tinType === 'SSN',
            Email: recipient.email || '',
            Address: {
              Address1: recipient.address,
              City: recipient.city,
              State: recipient.state,
              ZipCd: recipient.zipCode
            }
          },
          NECFormData: {
            B1NonemployeeComp: this.formatAmount(form.nonemployeeCompensation),
            IsFATCA: false
          }
        }
      ]
    };

    try {
      const response = await this.client.post('/Form1099NEC/Create', requestData, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (response.data.StatusCode !== 200) {
        throw new Error(`TaxBandits submission failed: ${response.data.StatusMessage}`);
      }

      // Extract submission and record IDs from response
      const submissionId = response.data.SubmissionId;
      const recordId = response.data.Form1099Records?.[0]?.RecordId;

      return { submissionId, recordId };
    } catch (error) {
      console.error('TaxBandits submission error:', error);
      throw error;
    }
  }

  async getSubmissionStatus(submissionId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.client.get(`/Form1099NEC/Status/${submissionId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('TaxBandits status check error:', error);
      throw error;
    }
  }

  async validateTIN(tin: string, tinType: 'SSN' | 'EIN'): Promise<boolean> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.client.post(
        '/TINMatching/Match',
        {
          TIN: tin,
          TINType: tinType
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return response.data.IsMatch === true;
    } catch (error) {
      console.error('TIN validation error:', error);
      return false;
    }
  }
}

export const taxbanditsService = new TaxBanditsService();
