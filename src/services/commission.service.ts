import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CommissionSearchResponse {
  code: number;
  message: string;
  data: CommissionRecord[];
}

export interface CommissionRecord {
  id: number;
  requestDataId?: number;
  transId?: string;
  accountName?: string | null;
  bankCode?: string | null;
  commissionAmount?: number | string | null;
  commissionPaidStatus?: string | null;
  rate?: number | string | null;
  accountOfficer?: string | null;
  transactionType?: string | null;
  productTypeId?: string | null;
  coverTypeId?: string | null;
  clientName?: string | null;
  clientId?: string | null;
  brokerName?: string | null;
  brokerEmail?: string | null;
  tempPolicyNumber?: string | null;
  permanentPolicyNumber?: string | null;
  control?: string | null;
  controlComment?: string | null;
  controlCreateDate?: string | null;
  controlIp?: string | null;
  finance?: string | null;
  financeComment?: string | null;
  financeCreateDate?: string | null;
  financeIp?: string | null;
  cibResponse?: string | null;
  cibStatus?: string | null;
  wkf?: string | null | undefined;
  dateCreated?: string | null;
}

export interface BankOption {
  bankName: string;
  bankCode: string;
}

export interface AccountValidationRequest {
  accountNumber: string;
  bankCode: string;
}

export interface AccountValidationResult {
  status: boolean;
  result: {
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_code: string;
    requests: null;
    execution_time: string;
  };
}

export interface CommissionClaimRequest {
  id: number | undefined;
  requestDataId: number;
  accountName: string;
  bankCode: string;
  control: string;
  controlComment: string;
  controlCreateDate: string;
  controlIp: string;
  finance: string;
  financeComment: string;
  financeCreateDate: string;
  financeIp: string;
  cibResponse: string;
  cibStatus: string;
  wkf: string | null | undefined;
  createDate: string;
  accountNo: string;
}

export interface CommissionClaimResponse {
  code: number;
  message: string;
  data: boolean;
}

export interface CommissionDecisionRequest {
  requestId: number[];
  approver: string;
  approverComment: string;
}

export interface CommissionDecisionResponse {
  code: number;
  message: string;
  data?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class CommissionService {
  private readonly commissionApiUrl = 'http://172.31.60.81/BrokerPortalEDashBoard/api/Commission';
  private readonly bankApiUrl = 'http://172.31.60.81/NubanAccountValidator/api/Nuban';

  constructor(private http: HttpClient) {}

  searchCommissionByPolicyNumber(
    policyNumber: string,
    brokerId?: string,
  ): Observable<CommissionSearchResponse> {
    const params: Record<string, string> = {
      policyNumbers: policyNumber,
    };

    const request$ = brokerId
      ? this.http.get<CommissionSearchResponse>(
          `${this.commissionApiUrl}/GetAllCommissionsForBroker`,
          {
            params: { ...params, brokerId },
            withCredentials: true,
          },
        )
      : this.http.get<CommissionSearchResponse>(
          `${this.commissionApiUrl}/GetAllCommissionForAccountOfficerByPolicyNumber`,
          {
            params,
            withCredentials: true,
          },
        );

    return request$.pipe(
      catchError((error) => {
        const status = Number(error?.status ?? 0);
        const message = String(error?.error?.message ?? error?.message ?? '');

        if (status === 400 && /not yet settled/i.test(message)) {
          return of({
            code: 400,
            message,
            data: [],
          });
        }

        return of({
          code: status || 500,
          message: message || 'Request failed.',
          data: [],
        });
      }),
    );
  }

  getAllCommissionsForApprover(user: string): Observable<CommissionSearchResponse> {
    const normalizedUser = String(user ?? '').trim();

    return this.http
      .get<CommissionSearchResponse>(`${this.commissionApiUrl}/GetAllCommissionsForApprover`, {
        params: { user: normalizedUser.toLowerCase() },
        withCredentials: false,
      })
      .pipe(
        catchError((error) => {
          const status = Number(error?.status ?? 0);
          const errorMessage = String(error?.error?.message ?? error?.message ?? '');
          const noPermission =
            status === 400 ||
            /permission/i.test(errorMessage) ||
            /does not have the permission/i.test(errorMessage);

          return of({
            code: noPermission ? 200 : status || 500,
            message: noPermission
              ? 'No records found for this approver.'
              : errorMessage || 'Request failed.',
            data: [],
          });
        }),
      );
  }

  getBanks(): Observable<BankOption[]> {
    return this.http.get<BankOption[]>(`${this.bankApiUrl}/getBankData`, {
      withCredentials: true,
    });
  }

  validateAccount(request: AccountValidationRequest): Observable<AccountValidationResult> {
    return this.http.post<AccountValidationResult>(`${this.bankApiUrl}/getBankDetails`, request, {
      withCredentials: true,
    });
  }

  submitClaim(claims: CommissionClaimRequest[]): Observable<CommissionClaimResponse> {
    return this.http.post<CommissionClaimResponse>(
      `${this.commissionApiUrl}/AddAllCommissionsForAccountOfficer`,
      claims,
      {
        withCredentials: true,
      },
    );
  }

  approveCommissionRecord(
    requestId: number,
    approver: string,
    approverComment: string,
  ): Observable<CommissionDecisionResponse> {
    const payload: CommissionDecisionRequest = {
      requestId: [requestId],
      approver,
      approverComment,
    };

    return this.http.post<CommissionDecisionResponse>(
      `${this.commissionApiUrl}/ApproveCommissionRecord`,
      payload,
      {
        withCredentials: false,
      },
    );
  }

  rejectCommissionRecord(
    requestId: number,
    approver: string,
    approverComment: string,
  ): Observable<CommissionDecisionResponse> {
    const payload: CommissionDecisionRequest = {
      requestId: [requestId],
      approver,
      approverComment,
    };

    return this.http.post<CommissionDecisionResponse>(
      `${this.commissionApiUrl}/RejectCommissionRecord`,
      payload,
      {
        withCredentials: false,
      },
    );
  }
}
