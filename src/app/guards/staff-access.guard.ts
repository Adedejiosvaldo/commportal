import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { resolveDepartmentName } from '../../services/auth.service';

export type StaffDepartment = 'ICNA' | 'Finance';

export const claimAccessGuard: CanActivateFn = () => {
  const router = inject(Router);
  const rawState = sessionStorage.getItem('lookupState');

  if (!rawState) {
    router.navigate(['/policy-lookup']);
    return false;
  }

  try {
    const state = JSON.parse(rawState);
    if (!state?.policyNumber) {
      router.navigate(['/policy-lookup']);
      return false;
    }
  } catch {
    sessionStorage.removeItem('lookupState');
    router.navigate(['/policy-lookup']);
    return false;
  }

  return true;
};

export const staffAccessGuard = (requiredDepartment: StaffDepartment): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const rawSession = sessionStorage.getItem('staffSession');

    if (!rawSession) {
      router.navigate(['/staff-login']);
      return false;
    }

    try {
      const session = JSON.parse(rawSession);
      const token = String(session?.token ?? '').trim();
      const department = String(
        session?.effectiveDepartment ?? session?.userDept ?? session?.department ?? '',
      )
        .trim()
        .toUpperCase();
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      const roleText = roles
        .map((role: any) => String(role ?? '').trim())
        .join(' ')
        .toUpperCase();
      const userDeptText = String(session?.userDept ?? '')
        .trim()
        .toUpperCase();
      const isInfoTechUser =
        /INFO TECH|INFORMATION TECHNOLOGY|IT/.test(`${roleText} ${userDeptText}`) ||
        /INFO TECH|INFORMATION TECHNOLOGY|IT/.test(department);
      const validDepartment =
        department === requiredDepartment.toUpperCase() ||
        (isInfoTechUser && (requiredDepartment === 'ICNA' || requiredDepartment === 'Finance'));

      if (!token || !validDepartment) {
        sessionStorage.removeItem('staffSession');
        sessionStorage.removeItem('activeQueue');
        router.navigate(['/staff-login']);
        return false;
      }
    } catch {
      sessionStorage.removeItem('staffSession');
      sessionStorage.removeItem('activeQueue');
      router.navigate(['/staff-login']);
      return false;
    }

    return true;
  };
};

export const icnaAccessGuard: CanActivateFn = staffAccessGuard('ICNA');
export const cfoAccessGuard: CanActivateFn = staffAccessGuard('Finance');
