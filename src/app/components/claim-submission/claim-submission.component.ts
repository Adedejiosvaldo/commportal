import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  BankOption,
  CommissionClaimRequest,
  CommissionService,
} from '../../../services/commission.service';
import { LookupStateService } from '../../../services/lookup-state.service';

@Component({
  selector: 'app-claim-submission',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './claim-submission.component.html',
})
export class ClaimSubmissionComponent {
  protected banks = signal<BankOption[]>([]);
  protected selectedBankCode = '';
  protected selectedBankName = '';
  protected accountNumber = '';
  protected accountVerified = signal<boolean>(false);
  protected matchedAccountName = signal<string>('');
  protected validationMessage = signal<string>('');
  protected isProcessing = signal<boolean>(false);
  protected isSuccessModalOpen = signal<boolean>(false);
  protected claimRef = signal<string>(Math.floor(100000 + Math.random() * 900000).toString());
  protected availableCommission = signal<number>(0);

  private policyNumber = '';
  private expectedAccountName = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private commissionService: CommissionService,
    private lookupState: LookupStateService,
  ) {
    const priorState = this.lookupState.get();
    if (!priorState) {
      this.router.navigate(['/policy-lookup']);
      return;
    }

    this.route.queryParams.subscribe((params) => {
      this.policyNumber = params['ref'] ?? priorState?.policyNumber ?? '';
      this.expectedAccountName = params['accountName'] ?? priorState.accountOfficer ?? '';

      const rawAmount = String(params['amount'] ?? priorState.amount ?? '0');
      const parsedAmount = Number(rawAmount.replace(/[^\d.-]/g, ''));
      this.availableCommission.set(Number.isFinite(parsedAmount) ? parsedAmount : 0);
    });

    this.loadBanks();
  }

  protected onAccountInput() {
    this.accountVerified.set(false);
    this.matchedAccountName.set('');
    this.validationMessage.set('');

    if (this.accountNumber.length !== 10 || !this.selectedBankCode) {
      return;
    }

    this.validateBankAccount();
  }

  protected onBankChange() {
    this.accountVerified.set(false);
    this.matchedAccountName.set('');
    this.validationMessage.set('');

    if (this.accountNumber.length === 10 && this.selectedBankCode) {
      this.validateBankAccount();
    }
  }

  protected onProcessClaim(event: Event) {
    event.preventDefault();

    if (!this.accountVerified() || !this.selectedBankCode || !this.accountNumber) {
      this.validationMessage.set('Please verify your bank account before submitting the claim.');
      return;
    }

    this.isProcessing.set(true);

    const lookupState = this.lookupState.get();
    const requestDataId = lookupState?.requestDataId ?? 0;

    const payload: CommissionClaimRequest[] = [
      {
        id: lookupState?.id,
        requestDataId,
        accountName: this.matchedAccountName(),
        accountNo: this.accountNumber,
        bankCode: this.selectedBankCode,
        control: 'string',
        controlComment: 'string',
        controlCreateDate: 'string',
        controlIp: 'string',
        finance: 'string',
        financeComment: 'string',
        financeCreateDate: 'string',
        financeIp: 'string',
        cibResponse: 'string',
        cibStatus: 'string',
        wkf: lookupState?.wkfId,
        createDate: new Date().toISOString(),
      },
    ];

    this.commissionService.submitClaim(payload).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.isSuccessModalOpen.set(true);
      },
      error: (error: any) => {
        this.isProcessing.set(false);
        this.validationMessage.set('Unable to submit claim. Please try again.');
        console.error('Commission claim failed', error);
      },
    });
  }

  protected closeSuccessModal() {
    this.isSuccessModalOpen.set(false);
    this.lookupState.clear();
    sessionStorage.removeItem('lookupState');
    const lookupRoute = this.router.createUrlTree(['/policy-lookup']);
    this.router.navigateByUrl(lookupRoute).then(() => {
      const lookupState = this.lookupState.get();
      if (lookupState) {
        this.lookupState.clear();
      }
      sessionStorage.removeItem('lookupState');
    });
  }

  private nameTokens(value: string): string[] {
    return (value ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Names are compared token by token so that word order and extra names on the
   * bank record do not break the match. Every token the portal holds must be
   * present on the bank account name; extra bank tokens (middle names) are allowed.
   */
  private namesMatch(bankAccountName: string, expectedName: string): boolean {
    const bankTokens = new Set(this.nameTokens(bankAccountName));
    const expectedTokens = this.nameTokens(expectedName);

    if (!bankTokens.size || !expectedTokens.length) {
      return false;
    }

    return expectedTokens.every((token) => bankTokens.has(token));
  }

  private loadBanks() {
    this.commissionService.getBanks().subscribe({
      next: (banks: any) => {
        this.banks.set(banks ?? []);
      },
      error: (error: any) => {
        console.error('Load banks failed', error);
      },
    });
  }

  private validateBankAccount() {
    const accountNumber = this.accountNumber.trim();
    const bankCode = this.selectedBankCode;

    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
      return;
    }

    this.commissionService.validateAccount({ accountNumber, bankCode }).subscribe({
      next: (response: any) => {
        const accountName = response?.result?.account_name?.trim();
        const expectedAccountName = (this.expectedAccountName ?? '').trim();

        if (!response?.status || !accountName || !expectedAccountName) {
          this.accountVerified.set(false);
          this.matchedAccountName.set('');
          this.validationMessage.set(
            'Account name could not be validated. Please confirm the account details and try again.',
          );
          return;
        }

        if (this.namesMatch(accountName, expectedAccountName)) {
          this.accountVerified.set(true);
          this.matchedAccountName.set(accountName);
          this.validationMessage.set('Account name matches the policy account officer.');
        } else {
          this.accountVerified.set(false);
          this.matchedAccountName.set('');
          this.validationMessage.set(
            `Account name does not match the policy account officer. Expected: ${expectedAccountName}`,
          );
        }
      },
      error: (error: any) => {
        console.error('Account validation failed', error);
        this.accountVerified.set(false);
        this.matchedAccountName.set('');
        this.validationMessage.set(
          'Account validation failed. Please confirm the account number and bank selection.',
        );
      },
    });
  }
}
