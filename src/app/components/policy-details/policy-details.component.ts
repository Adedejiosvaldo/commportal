import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { CommissionService } from '../../../services/commission.service';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './policy-details.component.html',
})
export class PolicyDetailsComponent {
  protected isApproved = signal<boolean>(false);
  protected isRejected = signal<boolean>(false);
  protected isSidebarOpen = signal<boolean>(true);
  protected decisionModalOpen = false;
  protected decisionAction: 'approve' | 'reject' = 'approve';
  protected approverComment = '';
  protected decisionError = '';
  protected currentRequestId: number | null = null;

  protected policy = signal<PolicyDetail>({
    policyNumber: 'N/A',
    clientName: 'N/A',
    policyType: 'Commission Review',
    brokerName: 'N/A',
    brokerId: 'N/A',
    grossPremium: '0',
    commissionRate: '0%',
    commissionAmount: '0',
    effectiveDate: 'N/A',
    riskLocation: 'N/A',
    bankName: 'N/A',
    accountNumber: 'N/A',
    accountName: 'N/A',
    status: 'Pending Review',
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private commissionService: CommissionService,
  ) {
    this.route.queryParams.subscribe((params) => {
      const ref = String(params['ref'] ?? '').trim();
      const queueRaw = sessionStorage.getItem('approverQueue');
      const queue = queueRaw ? JSON.parse(queueRaw) : [];

      const match = queue.find((item: any) => {
        const candidateRefs = [
          item?.tempPolicyNumber,
          item?.permanentPolicyNumber,
          item?.transId,
          item?.requestDataId,
          item?.id,
        ]
          .filter((value) => value !== null && value !== undefined && value !== '')
          .map((value) => String(value));

        return candidateRefs.some((candidate) => candidate === ref || candidate === `REF-${ref}`);
      });

      if (match) {
        this.currentRequestId = Number(match.requestDataId ?? match.id ?? 0) || null;

        this.policy.set({
          policyNumber:
            match.tempPolicyNumber ??
            match.permanentPolicyNumber ??
            match.transId ??
            `REF-${match.requestDataId ?? match.id}`,
          clientName: match.clientName ?? 'Unknown Client',
          policyType: `${match.transactionType ?? 'Commission'} • ${match.productTypeId ?? 'Policy'}`,
          brokerName: match.brokerName ?? 'Unknown Broker',
          brokerId: match.brokerEmail ?? match.clientId ?? 'N/A',
          grossPremium: this.formatCurrency(Number(match.commissionAmount ?? 0) / 0.02 || 0),
          commissionRate: `${String(match.rate ?? '0.02')}%`,
          commissionAmount: this.formatCurrency(match.commissionAmount ?? 0),
          effectiveDate: this.formatDate(match.dateCreated),
          riskLocation: match.coverTypeId ?? 'N/A',
          bankName: this.bankName(match.bankCode),
          accountNumber: match.accountNo ?? 'N/A',
          accountName: match.accountName ?? 'N/A',
          status: String(match.wkf ?? '0') === '1' ? 'Verified' : 'Pending Review',
        });
        return;
      }

      if (ref) {
        this.currentRequestId = null;
        this.policy.set({
          ...this.policy(),
          policyNumber: ref,
          status: 'Pending Review',
        });
      }
    });
  }

  protected toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  protected openDecisionModal(action: 'approve' | 'reject') {
    if (!this.currentRequestId) {
      return;
    }

    this.decisionAction = action;
    this.approverComment = '';
    this.decisionError = '';
    this.decisionModalOpen = true;
  }

  protected closeDecisionModal() {
    this.decisionModalOpen = false;
    this.approverComment = '';
    this.decisionError = '';
  }

  protected submitDecision() {
    const requestId = this.currentRequestId;
    const comment = this.approverComment.trim();

    if (!requestId || !comment) {
      this.decisionError = 'Please add a comment before submitting this decision.';
      return;
    }

    const approver = this.getCurrentApprover();
    const action = this.decisionAction;

    const request$ =
      action === 'approve'
        ? this.commissionService.approveCommissionRecord(requestId, approver, comment)
        : this.commissionService.rejectCommissionRecord(requestId, approver, comment);

    request$.subscribe({
      next: () => {
        if (action === 'approve') {
          this.isApproved.set(true);
          this.isRejected.set(false);
        } else {
          this.isRejected.set(true);
          this.isApproved.set(false);
        }

        this.decisionModalOpen = false;
        this.approverComment = '';
        this.decisionError = '';

        setTimeout(() => {
          this.router.navigate(['/icna-dashboard']);
        }, 1500);
      },
      error: (error) => {
        console.error(`Failed to ${action} commission record`, error);
        this.decisionError = `Unable to ${action} this commission record. Please try again.`;
      },
    });
  }

  protected onAccept() {
    this.openDecisionModal('approve');
  }

  protected onReject() {
    this.openDecisionModal('reject');
  }

  private getCurrentApprover(): string {
    const rawSession = sessionStorage.getItem('staffSession');
    const session = rawSession ? JSON.parse(rawSession) : null;

    return session?.userName ?? session?.username ?? session?.staffNumber ?? 'unknown.approver';
  }

  private formatCurrency(value: number | string | null | undefined): string {
    const numericValue = Number(value ?? 0);
    if (!Number.isFinite(numericValue)) {
      return '0';
    }

    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  private bankName(code: string | null | undefined): string {
    const map: Record<string, string> = {
      '044': 'Access Bank Plc',
      '011': 'First Bank of Nigeria Plc',
      '057': 'Zenith Bank Plc',
      '058': 'Guaranty Trust Bank Plc',
      '033': 'United Bank for Africa Plc',
    };

    return map[String(code ?? '').trim()] ?? 'Bank Not Listed';
  }
}
