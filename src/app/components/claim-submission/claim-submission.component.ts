import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-claim-submission',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './claim-submission.component.html'
})
export class ClaimSubmissionComponent {
  protected selectedBank = 'zenith';
  protected accountNumber = '0123456789';
  protected accountVerified = signal<boolean>(true);
  protected isProcessing = signal<boolean>(false);
  protected isSuccessModalOpen = signal<boolean>(false);
  protected claimRef = signal<string>(Math.floor(100000 + Math.random() * 900000).toString());

  constructor(private router: Router) {}

  protected onAccountInput() {
    this.accountVerified.set(this.accountNumber.length === 10);
  }

  protected onProcessClaim(event: Event) {
    event.preventDefault();
    this.isProcessing.set(true);
    setTimeout(() => {
      this.isProcessing.set(false);
      this.isSuccessModalOpen.set(true);
    }, 1000);
  }

  protected closeSuccessModal() {
    this.isSuccessModalOpen.set(false);
    this.router.navigate(['/policy-lookup']);
  }
}
