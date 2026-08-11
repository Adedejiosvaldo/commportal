import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
  templateUrl: './icna-dashboard.component.html'
})
export class IcnaDashboardComponent {
  protected Math = Math;
  protected searchQuery = '';
  protected inspectingClaim = signal<AuditClaim | null>(null);
  protected currentPage = signal<number>(1);
  protected pageSize = 5;
  protected isSidebarOpen = signal<boolean>(true);

  protected claims = signal<AuditClaim[]>([
    { id: '1', policyNumber: 'ZG/TP/1000/84920/01', clientName: 'Dangote Logistics Corp', brokerName: 'Oluwaseun Adeyemi', brokerId: 'BRK-9904', amount: '1,250,000', status: 'Verified', selected: false },
    { id: '2', policyNumber: 'ZG/TP/1000/91042/02', clientName: 'Oceanic Marine Services', brokerName: 'Apex Insurance Brokers Ltd', brokerId: 'BRK-4412', amount: '5,760,000', status: 'Pending Review', selected: false },
    { id: '3', policyNumber: 'ZG/TP/1000/30219/03', clientName: 'MainOne Data Center Facility', brokerName: 'Oluwaseun Adeyemi', brokerId: 'BRK-9904', amount: '840,000', status: 'Verified', selected: false },
    { id: '4', policyNumber: 'ZG/TP/1000/11094/04', clientName: 'BUA Cement Processing', brokerName: 'Heritage Risk Consultants', brokerId: 'BRK-1092', amount: '14,200,000', status: 'Pending Review', selected: false },
    { id: '5', policyNumber: 'ZG/TP/1000/44810/05', clientName: 'Honeywell Flour Mills', brokerName: 'Allied Risk Management Ltd', brokerId: 'BRK-3301', amount: '3,450,000', status: 'Pending Review', selected: false },
    { id: '6', policyNumber: 'ZG/TP/1000/77219/06', clientName: 'Seplat Energy Operations', brokerName: 'Leadway Brokers Ltd', brokerId: 'BRK-2290', amount: '8,900,000', status: 'Pending Review', selected: false },
    { id: '7', policyNumber: 'ZG/TP/1000/55012/07', clientName: 'Flour Mills of Nigeria', brokerName: 'Apex Insurance Brokers Ltd', brokerId: 'BRK-4412', amount: '2,100,000', status: 'Verified', selected: false },
    { id: '8', policyNumber: 'ZG/TP/1000/88194/08', clientName: 'Oando Clean Energy', brokerName: 'Oluwaseun Adeyemi', brokerId: 'BRK-9904', amount: '6,300,000', status: 'Pending Review', selected: false },
    { id: '9', policyNumber: 'ZG/TP/1000/12940/09', clientName: 'Transcorp Power Plant', brokerName: 'Heritage Risk Consultants', brokerId: 'BRK-1092', amount: '9,150,000', status: 'Pending Review', selected: false },
    { id: '10', policyNumber: 'ZG/TP/1000/66410/10', clientName: 'Julius Berger Nigeria', brokerName: 'Allied Risk Management Ltd', brokerId: 'BRK-3301', amount: '4,800,000', status: 'Verified', selected: false }
  ]);

  constructor(private router: Router) {}

  protected toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  protected filteredClaims = computed(() => {
    let list = this.claims();
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(c => c.policyNumber.toLowerCase().includes(query) || c.brokerName.toLowerCase().includes(query) || c.clientName.toLowerCase().includes(query));
    }

    return list;
  });

  protected totalPages = computed(() => Math.ceil(this.filteredClaims().length / this.pageSize) || 1);

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

  protected selectedCount = computed(() => this.claims().filter(c => c.selected).length);

  protected toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.claims.update(list => list.map(c => ({ ...c, selected: checked })));
  }

  protected openReviewModal(claim: AuditClaim) {
    this.router.navigate(['/policy-details'], { queryParams: { ref: claim.policyNumber } });
  }

  protected approveClaim() {
    if (this.inspectingClaim()) {
      const id = this.inspectingClaim()!.id;
      this.claims.update(list => list.map(c => c.id === id ? { ...c, status: 'Verified' } : c));
      this.inspectingClaim.set(null);
    }
  }

  protected onBatchApprove() {
    this.claims.update(list => list.map(c => c.selected ? { ...c, status: 'Verified', selected: false } : c));
  }
}
