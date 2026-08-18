import { Injectable } from '@angular/core';

export interface LookupState {
  query: string;
  policyNumber: string;
  holder: string;
  amount: string;
  issueDate: string;
  accountOfficer: string;
  id: number;
  requestDataId?: number;
  wkfId: string | null | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class LookupStateService {
  private readonly storageKey = 'lookupState';
  private current: LookupState | null = null;

  set(state: LookupState | null) {
    this.current = state;

    if (!state) {
      sessionStorage.removeItem(this.storageKey);
      return;
    }

    sessionStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  get(): LookupState | null {
    if (this.current) {
      return this.current;
    }

    const rawState = sessionStorage.getItem(this.storageKey);
    if (!rawState) {
      return null;
    }

    try {
      this.current = JSON.parse(rawState) as LookupState;
      return this.current;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }

  clear() {
    this.current = null;
    sessionStorage.removeItem(this.storageKey);
  }
}
