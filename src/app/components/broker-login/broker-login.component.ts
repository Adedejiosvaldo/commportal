import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-broker-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broker-login.component.html'
})
export class BrokerLoginComponent {
  protected email = 'testbroker@test.com';
  protected password = 'NewPassword1%';
  protected showPassword = signal<boolean>(false);

  constructor(private router: Router) {}

  protected onSignIn(event: Event) {
    event.preventDefault();
    this.router.navigate(['/policy-lookup']);
  }
}
