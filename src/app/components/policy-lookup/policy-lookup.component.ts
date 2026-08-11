import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-policy-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './policy-lookup.component.html'
})
export class PolicyLookupComponent {
  protected searchQuery = '';
  protected hasSearched = signal<boolean>(false);
  protected validationError = signal<string | null>(null);
  protected searchState = signal<'active' | 'claimed' | 'empty'>('active');

  protected activePolicyNumber = signal<string>('ZG/TP/1000/84920/01');
  protected activePolicyAmount = signal<string>('1,250,000');
  protected activePolicyHolder = signal<string>('Dangote Logistics Corp');
  protected activeIssueDate = signal<string>('Jan 15, 2026');

  protected onInput() {
    if (this.validationError()) {
      this.validationError.set(null);
    }
  }

  protected clearSearch() {
    this.searchQuery = '';
    this.hasSearched.set(false);
    this.validationError.set(null);
  }

  protected onSearch() {
    const rawQuery = this.searchQuery.trim();
    const query = rawQuery.toUpperCase();

    // 1. Validation: Can't search if nothing is inputted
    if (!query) {
      this.validationError.set('Please enter a temporary policy number before searching.');
      this.hasSearched.set(false);
      return;
    }

    // 2. Validation: Must start with ZG/TP/1000/ followed by one or more number segments (/x/x/x...)
    const policyPattern = /^ZG\/TP\/1000(\/\d+)+$/i;
    const isValidFormat = policyPattern.test(query);

    if (!isValidFormat) {
      this.validationError.set('Invalid policy format! Must start with ZG/TP/1000/ followed by number segments (e.g., ZG/TP/1000/84920 or ZG/TP/1000/84920/01).');
      this.hasSearched.set(false);
      return;
    }

    // Clear error & display search results
    this.validationError.set(null);
    this.hasSearched.set(true);

    if (query.endsWith('/00') || query.endsWith('/000') || query.includes('CLAIM')) {
      this.searchState.set('claimed');
      this.activePolicyNumber.set(query);
    } else if (query.endsWith('/99') || query.endsWith('/999') || query.includes('NOTFOUND')) {
      this.searchState.set('empty');
      this.activePolicyNumber.set(query);
    } else {
      this.searchState.set('active');
      this.activePolicyNumber.set(query);

      if (query.includes('91042')) {
        this.activePolicyAmount.set('5,760,000');
        this.activePolicyHolder.set('Oceanic Marine Services');
        this.activeIssueDate.set('Feb 01, 2026');
      } else if (query.includes('30219')) {
        this.activePolicyAmount.set('840,000');
        this.activePolicyHolder.set('MainOne Data Center');
        this.activeIssueDate.set('Mar 10, 2026');
      } else {
        this.activePolicyAmount.set('1,250,000');
        this.activePolicyHolder.set('Dangote Logistics Corp');
        this.activeIssueDate.set('Jan 15, 2026');
      }
    }
  }
}
