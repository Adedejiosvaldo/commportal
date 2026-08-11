import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

export interface PolicyDetail {
  policyNumber: string;
  clientName: string;
  policyType: string;
  brokerName: string;
  brokerId: string;
  grossPremium: string;
  commissionRate: string;
  commissionAmount: string;
  effectiveDate: string;
  riskLocation: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
}

@Component({
  selector: 'app-policy-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './policy-details.component.html'
})
export class PolicyDetailsComponent {
  protected isApproved = signal<boolean>(false);
  protected isRejected = signal<boolean>(false);
  protected isSidebarOpen = signal<boolean>(true);
  
  protected policy = signal<PolicyDetail>({
    policyNumber: 'ZG/TP/1000/84920/01',
    clientName: 'Dangote Logistics Corp',
    policyType: 'Commercial Fleet Policy',
    brokerName: 'Oluwaseun Adeyemi',
    brokerId: 'BRK-9904',
    grossPremium: '62,500,000',
    commissionRate: '2.0%',
    commissionAmount: '1,250,000',
    effectiveDate: 'Jan 15, 2026',
    riskLocation: 'Lagos, Nigeria',
    bankName: 'Zenith Bank Plc',
    accountNumber: '2084910293',
    accountName: 'Oluwaseun Adeyemi',
    status: 'Pending Review'
  });

  constructor(private router: Router, private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['ref']) {
        const ref = params['ref'];
        if (ref.includes('91042')) {
          this.policy.set({
            policyNumber: 'ZG/TP/1000/91042/02',
            clientName: 'Oceanic Marine Services',
            policyType: 'Marine Cargo Cover',
            brokerName: 'Apex Insurance Brokers Ltd',
            brokerId: 'BRK-4412',
            grossPremium: '288,000,000',
            commissionRate: '2.0%',
            commissionAmount: '5,760,000',
            effectiveDate: 'Feb 01, 2026',
            riskLocation: 'Port Harcourt, Nigeria',
            bankName: 'Guaranty Trust Bank (GTB)',
            accountNumber: '0129481029',
            accountName: 'Apex Insurance Brokers Ltd',
            status: 'Pending Review'
          });
        } else if (ref.includes('30219')) {
          this.policy.set({
            policyNumber: 'ZG/TP/1000/30219/03',
            clientName: 'MainOne Data Center Facility',
            policyType: 'Industrial All Risk (IAR)',
            brokerName: 'Oluwaseun Adeyemi',
            brokerId: 'BRK-9904',
            grossPremium: '42,000,000',
            commissionRate: '2.0%',
            commissionAmount: '840,000',
            effectiveDate: 'Mar 10, 2026',
            riskLocation: 'Lekki Free Zone, Lagos',
            bankName: 'Zenith Bank Plc',
            accountNumber: '2084910293',
            accountName: 'Oluwaseun Adeyemi',
            status: 'Pending Review'
          });
        }
      }
    });
  }

  protected toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  protected onAccept() {
    this.isApproved.set(true);
    setTimeout(() => {
      this.router.navigate(['/icna-dashboard']);
    }, 1500);
  }

  protected onReject() {
    this.isRejected.set(true);
    setTimeout(() => {
      this.router.navigate(['/icna-dashboard']);
    }, 1500);
  }
}
