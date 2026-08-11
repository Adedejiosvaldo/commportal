import { Routes } from '@angular/router';
import { BrokerLoginComponent } from './components/broker-login/broker-login.component';
import { StaffLoginComponent } from './components/staff-login/staff-login.component';
import { PolicyLookupComponent } from './components/policy-lookup/policy-lookup.component';
import { ClaimSubmissionComponent } from './components/claim-submission/claim-submission.component';
import { IcnaDashboardComponent } from './components/icna-dashboard/icna-dashboard.component';
import { CfoDashboardComponent } from './components/cfo-dashboard/cfo-dashboard.component';
import { PolicyDetailsComponent } from './components/policy-details/policy-details.component';
import { DesignGuideComponent } from './components/design-guide/design-guide.component';

export const routes: Routes = [
  { path: '', component: BrokerLoginComponent },
  { path: 'broker-login', component: BrokerLoginComponent },
  { path: 'staff', component: StaffLoginComponent },
  { path: 'staff-login', component: StaffLoginComponent },
  { path: 'policy-lookup', component: PolicyLookupComponent },
  { path: 'claim', component: ClaimSubmissionComponent },
  { path: 'icna-dashboard', component: IcnaDashboardComponent },
  { path: 'policy-details', component: PolicyDetailsComponent },
  { path: 'cfo-dashboard', component: CfoDashboardComponent },
  { path: 'design-guide', component: DesignGuideComponent },
  { path: '**', redirectTo: '' }
];
