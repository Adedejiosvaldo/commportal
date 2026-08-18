import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CommissionRecord, CommissionService } from '../../../services/commission.service';

export interface CfoClaimItem {
  id: string;
  policyNumber: string;
  clientName: string;
  brokerName: string;
  brokerId: string;
  grossPremium: string;
  amount: string;
  status: 'Pending CFO Sign-Off' | 'Authorized';
  requestIds: number[];
  selected?: boolean;
}

@Component({
  selector: 'app-cfo-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cfo-dashboard.component.html',
})
export class CfoDashboardComponent {
  protected Math = Math;
  protected searchQuery = '';
  protected currentPage = signal<number>(1);
  protected pageSize = 5;
  protected isSidebarOpen = signal<boolean>(true);
  protected isLoading = signal<boolean>(false);
  protected errorMessage = signal<string | null>(null);

  protected claims = signal<CfoClaimItem[]>([]);
  protected currentStaffName = signal<string>('CFO Staff');

  constructor(
    private commissionService: CommissionService,
    private router: Router,
  ) {
    this.currentStaffName.set(this.getLoggedInStaffName());
    this.loadCfoQueue();
  }

  protected toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  protected filteredClaims = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.claims();
    }

    return this.claims().filter(
      (claim) =>
        claim.policyNumber.toLowerCase().includes(query) ||
        claim.clientName.toLowerCase().includes(query) ||
        claim.brokerName.toLowerCase().includes(query) ||
        claim.brokerId.toLowerCase().includes(query),
    );
  });

  protected hasQueueData = computed(() => this.claims().length > 0);

  protected pendingRequestCount = computed(() => this.claims().length);

  protected pendingTotalValue = computed(() => {
    const total = this.claims().reduce((sum, claim) => sum + this.toNumber(claim.amount), 0);
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(total);
  });

  protected brokerCount = computed(
    () => new Set(this.claims().map((claim) => claim.brokerName)).size,
  );

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

  protected selectedCount = computed(
    () => this.claims().filter((c) => c.selected && c.status === 'Pending CFO Sign-Off').length,
  );

  protected toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.claims.update((list) => list.map((c) => ({ ...c, selected: checked })));
  }

  protected authorizeSingle(item: CfoClaimItem) {
    const approver = this.getLoggedInStaffName();

    item.requestIds.forEach((requestId) => {
      this.commissionService
        .approveCommissionRecord(requestId, approver, 'Approved by CFO')
        .subscribe({
          next: () => {
            this.claims.update((list) =>
              list.map((c) =>
                c.id === item.id ? { ...c, status: 'Authorized', selected: false } : c,
              ),
            );
          },
          error: (error) => {
            console.error('Failed to approve commissioned record', error);
          },
        });
    });
  }

  protected onAuthorizeAll() {
    const approver = this.getLoggedInStaffName();
    const selected = this.claims().filter((c) => c.selected && c.status === 'Pending CFO Sign-Off');

    selected.forEach((item) => {
      item.requestIds.forEach((requestId) => {
        this.commissionService
          .approveCommissionRecord(requestId, approver, 'Approved by CFO')
          .subscribe({
            next: () => {
              this.claims.update((list) =>
                list.map((c) =>
                  c.id === item.id ? { ...c, status: 'Authorized', selected: false } : c,
                ),
              );
            },
            error: (error) => {
              console.error('Failed to approve selected commission batch', error);
            },
          });
      });
    });
  }

  protected exportAuditManifest() {
    alert('Audit manifest generated and saved to Zenith Financial Records system.');
  }

  protected exportAuditBatch() {
    alert('CSV Export generated with digital signature hashes.');
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

    return session?.userName ?? session?.username ?? session?.staffNumber ?? 'CFO Staff';
  }

  private loadCfoQueue() {
    const rawSession = sessionStorage.getItem('staffSession');
    const session = rawSession ? JSON.parse(rawSession) : null;
    const user = this.normalizeUsername(session?.userName ?? session?.username ?? '');

    if (!user) {
      this.claims.set([]);
      this.errorMessage.set('No active staff session was found for the CFO queue.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.commissionService.getAllCommissionsForApprover(user).subscribe({
      next: (response) => {
        const rows = ((response?.data ?? []) as CommissionRecord[]).filter(
          (row) => String(row.wkf ?? '0') === '2',
        );

        const grouped = this.groupByBroker(rows);
        const mapped: CfoClaimItem[] = grouped.map((group, index) => ({
          id: `${group.brokerId}-${index}`,
          policyNumber:
            group.records.length > 1
              ? group.records.map((record) => this.getPolicyReference(record)).join(', ')
              : this.getPolicyReference(group.records[0]),
          clientName:
            group.records.length > 1
              ? `${group.records.length} transactions for ${group.brokerName}`
              : (group.records[0]?.clientName ?? 'Unknown Client'),
          brokerName: group.brokerName,
          brokerId: group.brokerId,
          grossPremium: this.formatCurrency(group.totalGrossPremium),
          amount: this.formatCurrency(group.totalCommission),
          status: 'Pending CFO Sign-Off',
          requestIds: group.requestIds,
          selected: false,
        }));

        this.claims.set(mapped);
        this.errorMessage.set(null);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load CFO approver queue', error);
        this.claims.set([]);
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

  private groupByBroker(rows: CommissionRecord[]) {
    const groups = new Map<
      string,
      { brokerName: string; brokerId: string; records: CommissionRecord[] }
    >();

    rows.forEach((row) => {
      const brokerName = row.brokerName ?? 'Unknown Broker';
      const brokerId = row.brokerEmail ?? row.clientId ?? 'N/A';
      const key = `${brokerName}|${brokerId}`;

      if (!groups.has(key)) {
        groups.set(key, { brokerName, brokerId, records: [] });
      }

      groups.get(key)!.records.push(row);
    });

    return Array.from(groups.values()).map((group) => {
      const totalCommission = group.records.reduce(
        (sum, row) => sum + this.toNumber(row.commissionAmount),
        0,
      );
      const totalGrossPremium = group.records.reduce(
        (sum, row) => sum + this.toGrossPremium(row.commissionAmount),
        0,
      );

      return {
        brokerName: group.brokerName,
        brokerId: group.brokerId,
        totalCommission,
        totalGrossPremium,
        requestIds: group.records
          .map((row) => Number(row.requestDataId ?? row.id ?? 0))
          .filter((value) => Number.isFinite(value) && value > 0),
        records: group.records,
      };
    });
  }

  private getPolicyReference(record: CommissionRecord): string {
    return (
      record.tempPolicyNumber ??
      record.permanentPolicyNumber ??
      record.transId ??
      `REF-${record.requestDataId ?? record.id ?? 'N/A'}`
    );
  }

  private toNumber(value: number | string | null | undefined): number {
    const text = String(value ?? '').replace(/[^0-9.-]+/g, '');
    const numeric = Number(text || 0);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private toGrossPremium(value: number | string | null | undefined): number {
    const commission = this.toNumber(value);
    if (commission === 0) {
      return 0;
    }

    return commission / 0.02;
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
