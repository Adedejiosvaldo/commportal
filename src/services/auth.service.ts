import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { environment } from '../environments/environment';

export interface BrokerLoginRequest {
  email: string;
  password: string;
}

export interface BrokerLoginResponse {
  code: number;
  message: string;
  data?: {
    userID?: string;
    userId?: string;
    brokerId?: string;
    id?: string;
    email?: string;
    token?: string;
  } | null;
}

export interface StaffAuthResponse {
  code: number;
  message: string;
  data: {
    userName?: string;
    userDept?: string;
    userEmail?: string;
    staffNumber?: string;
    phoneNumber?: string;
    userBranch?: string;
    enable?: boolean;
    roles?: string[];
    token?: string;
    approverList?: unknown[];
  };
}

export function normalizeGuid(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }

  const sanitized = raw.replace(/[{}()]/g, '').replace(/-/g, '');
  if (sanitized.length !== 32) {
    return raw;
  }

  return [
    sanitized.slice(0, 8),
    sanitized.slice(8, 12),
    sanitized.slice(12, 16),
    sanitized.slice(16, 20),
    sanitized.slice(20, 32),
  ].join('-');
}

export function resolveDepartmentName(value: string | null | undefined): 'ICNA' | 'Finance' {
  const deptText = String(value ?? '')
    .trim()
    .toUpperCase();

  if (!deptText) {
    return 'ICNA';
  }

  const isInfoTech =
    /INFO TECH|INFORMATION TECHNOLOGY|IT/.test(deptText) ||
    deptText.includes('INFORMATION TECHNOLOGY') ||
    deptText.includes('INFO TECH') ||
    deptText.includes('IT');

  if (isInfoTech) {
    return 'ICNA';
  }

  if (/ICNA|ICA|INTERNAL CONTROL/.test(deptText)) {
    return 'ICNA';
  }

  if (/FINANCE|CFO|CHIEF FINANCE|CHIEF FINANCIAL OFFICER/.test(deptText)) {
    return 'Finance';
  }

  return 'ICNA';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly brokerAuthApiUrl = 'http://172.31.60.81/brokersauth/api/broker-auth';

  constructor(private http: HttpClient) {}

  login(credentials: BrokerLoginRequest): Observable<any> {
    return this.brokerLogin(credentials);
  }

  brokerLogin(credentials: BrokerLoginRequest): Observable<BrokerLoginResponse> {
    return this.http.post<BrokerLoginResponse>(`${this.brokerAuthApiUrl}/login`, credentials, {
      withCredentials: true,
    });
  }

  authenticateStaff(username: string, pinOtp: string): Observable<StaffAuthResponse> {
    // if (environment.staffAuthMode === 'mock') {
    //   return of({
    //     ...(environment.mockStaffAuthResponse ?? {
    //       code: 200,
    //       message: 'Successful',
    //       data: {
    //         userDept: environment.devDepartmentOverride ?? 'ICNA',
    //         roles: [environment.devDepartmentOverride ?? 'ICNA'],
    //         token: 'tytyththtythtythtythty',
    //       },
    //     }),
    //   });
    // }

    return this.http.get<StaffAuthResponse>(`${environment.staffAuthEndpoint}/authenticate`, {
      params: {
        username,
        pinOTP: pinOtp,
      },
      withCredentials: false,
    });
  }
}
