import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CommissionRecord, CommissionService } from '../../../services/commission.service';

export interface AuditClaim {
  id: string;
  policyNumber: string;
  clientName: string;
  brokerName: string;
  brokerId: string;
  amount: string;
  status: 'Verified' | 'Pending Review';
  selected?: boolean;
}

@Component({
  selector: 'app-icna-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './icna-dashboard.component.html',
})
export class IcnaDashboardComponent {
  protected Math = Math;
  protected searchQuery = '';
  protected inspectingClaim = signal<AuditClaim | null>(null);
  protected currentPage = signal<number>(1);
  protected pageSize = 5;
  protected isSidebarOpen = signal<boolean>(true);
  protected claims = signal<AuditClaim[]>([]);
  protected isLoading = signal<boolean>(false);
  protected errorMessage = signal<string | null>(null);
  protected infoMessage = signal<string | null>(null);
  protected currentStaffName = signal<string>('ICNA Staff');

  constructor(
    private router: Router,
    private commissionService: CommissionService,
  ) {
    this.currentStaffName.set(this.getLoggedInStaffName());
    this.loadApproverQueue();
  }

  protected toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  protected filteredClaims = computed(() => {
    let list = this.claims();
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(
        (c) =>
          c.policyNumber.toLowerCase().includes(query) ||
          c.brokerName.toLowerCase().includes(query) ||
          c.clientName.toLowerCase().includes(query),
      );
    }

    return list;
  });

  protected totalPages = computed(
    () => Math.ceil(this.filteredClaims().length / this.pageSize) || 1,
  );

  protected paginatedClaims = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.filteredClaims().slice(startIndex, startIndex + this.pageSize);
  });

  protected pageNumbers = computed(() => {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  });

  protected goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected selectedCount = computed(() => this.claims().filter((c) => c.selected).length);

  protected pendingRequestCount = computed(() => this.claims().length);

  protected pendingTotalValue = computed(() => {
    const total = this.claims().reduce((sum, claim) => {
      const numericValue = Number(String(claim.amount).replace(/[^0-9.-]+/g, '')) || 0;
      return sum + numericValue;
    }, 0);

    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(total);
  });

  protected brokerCount = computed(
    () => new Set(this.claims().map((claim) => claim.brokerName)).size,
  );

  protected toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.claims.update((list) => list.map((c) => ({ ...c, selected: checked })));
  }

  protected openReviewModal(claim: AuditClaim) {
    this.router.navigate(['/policy-details'], { queryParams: { ref: claim.policyNumber } });
  }

  protected approveClaim() {
    if (this.inspectingClaim()) {
      const id = this.inspectingClaim()!.id;
      this.claims.update((list) =>
        list.map((c) => (c.id === id ? { ...c, status: 'Verified' } : c)),
      );
      this.inspectingClaim.set(null);
    }
  }

  protected onBatchApprove() {
    this.claims.update((list) =>
      list.map((c) => (c.selected ? { ...c, status: 'Verified', selected: false } : c)),
    );
  }

  protected logout() {
    sessionStorage.removeItem('staffSession');
    sessionStorage.removeItem('activeQueue');
    sessionStorage.removeItem('approverQueue');
    sessionStorage.removeItem('lookupState');
    this.router.navigate(['/staff-login']);
  }

  private getLoggedInStaffName(): string {
    const rawSession = sessionStorage.getItem('staffSession');
    const session = rawSession ? JSON.parse(rawSession) : null;

    return session?.userName ?? session?.username ?? session?.staffNumber ?? 'ICNA Staff';
  }

  private loadApproverQueue() {
    const rawSession = sessionStorage.getItem('staffSession');
    const session = rawSession ? JSON.parse(rawSession) : null;
    const user = this.normalizeUsername(session?.userName ?? session?.username ?? '');

    if (!user) {
      this.claims.set([]);
      this.errorMessage.set('No active staff session was found for the ICNA queue.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.commissionService.getAllCommissionsForApprover(user).subscribe({
      next: (response) => {
        const rows = (response?.data ?? []) as CommissionRecord[];
        const uniqueRows = this.dedupeRows(rows);

        const mapped: AuditClaim[] = uniqueRows.map((record, index) => ({
          id: String(record.requestDataId ?? record.id ?? index + 1),
          policyNumber:
            record.tempPolicyNumber ??
            record.permanentPolicyNumber ??
            record.transId ??
            `REF-${record.requestDataId ?? record.id ?? index + 1}`,
          clientName: record.clientName ?? 'Unknown Client',
          brokerName: record.brokerName ?? 'Unknown Broker',
          brokerId: record.brokerEmail ?? record.clientId ?? 'N/A',
          amount: this.formatCurrency(record.commissionAmount ?? 0),
          status: String(record.wkf ?? '0') === '1' ? 'Verified' : 'Pending Review',
          selected: false,
        }));

        sessionStorage.setItem('approverQueue', JSON.stringify(uniqueRows));
        this.claims.set(mapped);

        // if (this.claims().length === 0) {
        //   this.infoMessage.set('No records were populated for this approver.');
        // }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load ICNA approver queue', error);
        this.claims.set([]);
        this.infoMessage.set('No records were populated for this approver.');
        this.errorMessage.set(null);
        this.isLoading.set(false);
      },
    });
  }

  private normalizeUsername(value: string): string {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  private dedupeRows(rows: CommissionRecord[]): CommissionRecord[] {
    const seen = new Set<string>();

    return rows.filter((row) => {
      const key = String(row.requestDataId ?? row.id ?? row.transId ?? JSON.stringify(row));
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
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
}
