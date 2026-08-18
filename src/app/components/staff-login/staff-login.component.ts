import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  AuthService,
  StaffAuthResponse,
  resolveDepartmentName,
} from '../../../services/auth.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-login.component.html',
})
export class StaffLoginComponent {
  protected corporateId = 'joseph.adewunmi';
  protected securityCode = '200';
  protected showCode = signal<boolean>(false);
  protected loginError = signal<string | null>(null);

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  protected onAuthenticate(event: Event) {
    event.preventDefault();

    const username = this.corporateId.trim();
    const pinOtp = this.securityCode.trim();

    if (!username || !pinOtp) {
      this.loginError.set('Please enter your corporate email and PIN + OTP.');
      return;
    }

    this.loginError.set(null);

    this.authService.authenticateStaff(username, pinOtp).subscribe({
      next: (response: StaffAuthResponse) => {
        const data = response?.data ?? {};
        const resolvedDepartment = this.resolveDepartment(data);

        if (!data.token && !data.userDept && !data.roles?.length) {
          this.loginError.set(
            'Authentication failed. Please check your credentials and try again.',
          );
          sessionStorage.removeItem('staffSession');
          sessionStorage.removeItem('activeQueue');
          return;
        }

        sessionStorage.setItem(
          'staffSession',
          JSON.stringify({
            ...data,
            effectiveDepartment: resolvedDepartment,
            token: data.token ?? '',
          }),
        );
        sessionStorage.setItem('activeQueue', resolvedDepartment);

        if (resolvedDepartment === 'Finance') {
          this.router.navigate(['/cfo-dashboard']);
          return;
        }

        if (resolvedDepartment === 'ICNA') {
          this.router.navigate(['/icna-dashboard']);
          return;
        }

        this.loginError.set('Unable to resolve your department access. Please contact IT.');
        this.router.navigate(['/staff-login']);
      },
      error: (error) => {
        console.error('Staff authentication failed', error);
        this.loginError.set('Invalid email or PIN + OTP. Please try again.');
        sessionStorage.removeItem('staffSession');
        sessionStorage.removeItem('activeQueue');
      },
    });
  }

  private resolveDepartment(data: StaffAuthResponse['data']): 'ICNA' | 'Finance' {
    const roleText = Array.isArray(data.roles) ? data.roles.join(' ') : '';
    const combinedText = `${String(data.userDept ?? '')} ${roleText}`;

    const infoTechText = /INFO TECH|INFORMATION TECHNOLOGY|IT/i.test(combinedText);
    const icnaText = /ICNA|ICA|INTERNAL CONTROL.*AUDIT/i.test(combinedText);
    const financeText = /FINANCE|CFO|CHIEF FINANCE|CHIEF FINANCIAL OFFICER/i.test(combinedText);

    if (infoTechText) {
      return 'ICNA';
    }

    if (icnaText) {
      return 'ICNA';
    }

    if (financeText) {
      return 'Finance';
    }

    return resolveDepartmentName(String(data.userDept ?? ''));
  }
}
