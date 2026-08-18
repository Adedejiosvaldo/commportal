import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CommissionRecord, CommissionService } from '../../../services/commission.service';
import { LookupState, LookupStateService } from '../../../services/lookup-state.service';
import { normalizeGuid } from '../../../services/auth.service';

@Component({
  selector: 'app-policy-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './policy-lookup.component.html',
  providers: [DatePipe],
})
export class PolicyLookupComponent {
  protected searchQuery = '';
  protected hasSearched = signal<boolean>(false);
  protected validationError = signal<string | null>(null);
  protected searchState = signal<'active' | 'claimed' | 'empty'>('active');
  protected isLoading = signal<boolean>(false);

  protected activePolicyNumber = signal<string>('');
  protected activePolicyAmount = signal<string>('0');
  protected activePolicyHolder = signal<string>('');
  protected activeIssueDate = signal<string>('');
  protected activeAccountOfficer = signal<string>('');

  constructor(
    private commisionService: CommissionService,
    private lookupState: LookupStateService,
    private router: Router,
  ) {
    // The lookup always opens blank. Any stored state is claim-page payload only,
    // so a refresh or a Back out of the claim page never repaints an old search.
    this.lookupState.clear();
  }

  protected onClaimCommission() {
    if (this.searchState() === 'claimed' || !this.lookupState.get()) {
      return;
    }

    this.lookupState.authorizeClaim();
    this.router.navigate(['/claim'], {
      queryParams: {
        ref: this.activePolicyNumber(),
        accountName: this.activeAccountOfficer(),
        amount: this.activePolicyAmount(),
      },
    });
  }

  protected onInput() {
    if (this.validationError()) {
      this.validationError.set(null);
    }
  }

  protected clearSearch() {
    this.searchQuery = '';
    this.hasSearched.set(false);
    this.validationError.set(null);
    this.isLoading.set(false);
    this.searchState.set('active');
    this.activePolicyNumber.set('');
    this.activePolicyHolder.set('');
    this.activePolicyAmount.set('0');
    this.activeIssueDate.set('');
    this.activeAccountOfficer.set('');
    this.lookupState.clear();
  }

  protected logout() {
    sessionStorage.removeItem('staffSession');
    sessionStorage.removeItem('activeQueue');
    sessionStorage.removeItem('approverQueue');
    sessionStorage.removeItem('lookupState');
    this.lookupState.clear();
    this.router.navigate(['/']);
  }

  protected onSearch() {
    const rawQuery = this.searchQuery.trim();
    const query = rawQuery.toUpperCase();

    if (!query) {
      this.validationError.set('Please enter a temporary policy number before searching.');
      this.hasSearched.set(false);
      return;
    }

    const policyPattern = /^ZG\/TP\/1000(\/\d+)+$/i;
    const isValidFormat = policyPattern.test(query);

    if (!isValidFormat) {
      this.validationError.set(
        'Invalid policy format! Must start with ZG/TP/1000/ followed by number segments (e.g., ZG/TP/1000/84920 or ZG/TP/1000/84920/01).',
      );
      this.hasSearched.set(false);
      return;
    }

    this.validationError.set(null);
    this.hasSearched.set(false);
    this.isLoading.set(true);
    this.searchState.set('active');
    this.activePolicyNumber.set(query);
    this.activePolicyHolder.set('');
    this.activePolicyAmount.set('0');
    this.activeIssueDate.set('');
    this.activeAccountOfficer.set('');
    this.lookupState.clear();

    const brokerId = this.getBrokerUserId();

    this.commisionService.searchCommissionByPolicyNumber(query, brokerId).subscribe({
      next: (response) => {
        const policy = response?.data?.[0] as CommissionRecord | undefined;

        if (!response?.data || response.data.length === 0 || !policy) {
          const lookupMessage = String(response?.message ?? '');

          if (/not yet settled/i.test(lookupMessage)) {
            this.setFailureState(
              'This credit note has not been settled and is not ready for commission processing.',
            );
            return;
          }

          this.setFailureState(
            `No temporary policy found for ${query}. Please verify the policy number and try again.`,
          );
          return;
        }

        const policyNumber = policy.tempPolicyNumber ?? query;
        // accountName is the human name; accountOfficer is the login id (e.g. "joseph.adewunmi").
        const accountOfficer = String(policy.accountName || policy.accountOfficer || '').trim();
        const commissionAmount = Number(policy.commissionAmount ?? 0);
        const formattedAmount = Number.isFinite(commissionAmount)
          ? this.formatCurrency(commissionAmount)
          : '0';
        const issueDate = policy.dateCreated
          ? this.formatDate(new Date(policy.dateCreated))
          : 'N/A';

        const lookupState: LookupState = {
          query,
          policyNumber,
          holder: policy.clientName ?? 'Unknown client',
          amount: formattedAmount,
          issueDate,
          wkfId: policy.wkf,
          accountOfficer,
          id: policy.id,
          requestDataId: policy.requestDataId ?? policy.id ?? 0,
        };

        this.lookupState.set(lookupState);

        const isClaimed = policy.wkf === '1' || policy.wkf === '2' || policy.wkf === '3';
        // const isClaimed = String(policy.wkf ?? '').trim() === '1' ;

        if (isClaimed) {
          this.hasSearched.set(true);
          this.searchState.set('claimed');
          this.activePolicyNumber.set(policyNumber);
          this.activePolicyHolder.set(lookupState.holder);
          this.activeAccountOfficer.set(accountOfficer);
          this.activePolicyAmount.set('0');
          this.activeIssueDate.set(issueDate);
          this.isLoading.set(false);
          return;
        }

        this.hasSearched.set(true);
        this.searchState.set('active');
        this.activePolicyNumber.set(policyNumber);
        this.activePolicyHolder.set(lookupState.holder);
        this.activeAccountOfficer.set(accountOfficer);
        this.activePolicyAmount.set(formattedAmount);
        this.activeIssueDate.set(issueDate);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Policy lookup failed', error);
        const backendMessage = String(error?.error?.message ?? error?.message ?? '');

        if (/not yet settled/i.test(backendMessage)) {
          this.setFailureState(
            'This policy has not been settled yet and is not ready for claim processing.',
          );
          return;
        }

        this.setFailureState(
          'Unable to load commission details for this policy number. Please try again.',
        );
      },
    });
  }

  private getBrokerUserId(): string {
    const rawSession = sessionStorage.getItem('brokerSession');
    if (!rawSession) {
      return '';
    }

    try {
      const session = JSON.parse(rawSession);
      return normalizeGuid(
        String(session?.userId ?? session?.userID ?? session?.brokerId ?? session?.id ?? ''),
      );
    } catch {
      return '';
    }
  }

  private setFailureState(message: string) {
    this.hasSearched.set(false);
    this.searchState.set('empty');
    this.activePolicyHolder.set('');
    this.activePolicyAmount.set('0');
    this.activeIssueDate.set('');
    this.validationError.set(message);
    this.isLoading.set(false);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(value);
  }
}
