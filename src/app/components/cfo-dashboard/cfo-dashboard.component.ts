import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface CfoClaimItem {
  id: string;
  policyNumber: string;
  clientName: string;
  brokerName: string;
  brokerId: string;
  grossPremium: string;
  amount: string;
  status: 'Pending CFO Sign-Off' | 'Authorized';
  selected?: boolean;
}

@Component({
  selector: 'app-cfo-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cfo-dashboard.component.html'
})
export class CfoDashboardComponent {
  protected Math = Math;
  protected currentPage = signal<number>(1);
  protected pageSize = 5;
  protected isSidebarOpen = signal<boolean>(true);

  protected claims = signal<CfoClaimItem[]>([
    { id: '101', policyNumber: 'ZG/TP/1000/91042/02', clientName: 'Oceanic Marine Services', brokerName: 'Apex Insurance Brokers Ltd', brokerId: 'BRK-4412', grossPremium: '288,000,000', amount: '5,760,000', status: 'Pending CFO Sign-Off', selected: true },
    { id: '102', policyNumber: 'ZG/TP/1000/11094/04', clientName: 'BUA Cement Processing', brokerName: 'Heritage Risk Consultants', brokerId: 'BRK-1092', grossPremium: '710,000,000', amount: '14,200,000', status: 'Pending CFO Sign-Off', selected: true },
    { id: '103', policyNumber: 'ZG/TP/1000/77219/06', clientName: 'Seplat Energy Operations', brokerName: 'Leadway Brokers Ltd', brokerId: 'BRK-2290', grossPremium: '445,000,000', amount: '8,900,000', status: 'Pending CFO Sign-Off', selected: false },
    { id: '104', policyNumber: 'ZG/TP/1000/88194/08', clientName: 'Oando Clean Energy', brokerName: 'Oluwaseun Adeyemi', brokerId: 'BRK-9904', grossPremium: '315,000,000', amount: '6,300,000', status: 'Pending CFO Sign-Off', selected: false },
    { id: '105', policyNumber: 'ZG/TP/1000/12940/09', clientName: 'Transcorp Power Plant', brokerName: 'Heritage Risk Consultants', brokerId: 'BRK-1092', grossPremium: '457,500,000', amount: '9,150,000', status: 'Pending CFO Sign-Off', selected: false },
    { id: '106', policyNumber: 'ZG/TP/1000/84920/01', clientName: 'Dangote Logistics Corp', brokerName: 'Oluwaseun Adeyemi', brokerId: 'BRK-9904', grossPremium: '62,500,000', amount: '1,250,000', status: 'Authorized', selected: false },
    { id: '107', policyNumber: 'ZG/TP/1000/55012/07', clientName: 'Flour Mills of Nigeria', brokerName: 'Apex Insurance Brokers Ltd', brokerId: 'BRK-4412', grossPremium: '105,000,000', amount: '2,100,000', status: 'Authorized', selected: false }
  ]);

  protected toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  protected totalPages = computed(() => Math.ceil(this.claims().length / this.pageSize) || 1);

  protected paginatedClaims = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.claims().slice(startIndex, startIndex + this.pageSize);
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

  protected selectedCount = computed(() => this.claims().filter(c => c.selected && c.status === 'Pending CFO Sign-Off').length);

  protected toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.claims.update(list => list.map(c => ({ ...c, selected: checked })));
  }

  protected authorizeSingle(item: CfoClaimItem) {
    this.claims.update(list => list.map(c => c.id === item.id ? { ...c, status: 'Authorized', selected: false } : c));
  }

  protected onAuthorizeAll() {
    this.claims.update(list => list.map(c => c.selected ? { ...c, status: 'Authorized', selected: false } : c));
  }

  protected exportAuditManifest() {
    alert('Audit manifest generated and saved to Zenith Financial Records system.');
  }

  protected exportAuditBatch() {
    alert('CSV Export generated with digital signature hashes.');
  }
}
