export const environment = {
  production: true,
  mode: 'production',
  useMockData: false,
  apiBaseUrl: 'http://172.31.60.81',
  staffAuthEndpoint: 'http://172.18.13.18/ZGICHRLeavePortal/api/Token',
  staffAuthMode: 'live' as 'mock' | 'live',
  // devDepartmentOverride: 'ICNA' as 'ICNA' | 'Finance' | null,
  // devDepartmentOverride: 'null',
  devDepartmentOverride: null as 'ICNA' | 'Finance' | null,
  mockStaffAuthResponse: null,
};
