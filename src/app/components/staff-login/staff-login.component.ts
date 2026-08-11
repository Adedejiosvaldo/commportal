import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-login.component.html'
})
export class StaffLoginComponent {
  protected corporateId = 'john.doe@zenith.com';
  protected securityCode = 'ZenithStaff2026!';
  protected showCode = signal<boolean>(false);

  constructor(private router: Router) {}

  protected onAuthenticate(event: Event) {
    event.preventDefault();
    const email = this.corporateId.toLowerCase().trim();
    
    // Automatically route to CFO Dashboard if email is CFO/Executive, otherwise default to ICNA Dashboard
    if (email.includes('cfo') || email.includes('funmi') || email.includes('executive')) {
      this.router.navigate(['/cfo-dashboard']);
    } else {
      this.router.navigate(['/icna-dashboard']);
    }
  }
}
