import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, normalizeGuid } from '../../../services/auth.service';

@Component({
  selector: 'app-broker-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './broker-login.component.html',
})
export class BrokerLoginComponent {
  protected email = 'testbroker@test.com';
  protected password = 'NewPassword1%';
  protected showPassword = signal<boolean>(false);
  protected isSubmitting = signal<boolean>(false);
  protected errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  protected onSignIn(event: Event) {
    event.preventDefault();

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both your email and password.';
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage = '';

    this.authService
      .brokerLogin({
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          const brokerUserId = normalizeGuid(
            response?.data?.userId ??
              response?.data?.userID ??
              response?.data?.brokerId ??
              response?.data?.id ??
              '',
          );

          if (brokerUserId) {
            sessionStorage.setItem(
              'brokerSession',
              JSON.stringify({
                userId: brokerUserId,
                email: this.email,
              }),
            );
          }

          this.isSubmitting.set(false);
          this.router.navigate(['/policy-lookup']);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage = 'Unable to sign in. Please check your credentials and try again.';
          console.error('Broker login failed', error);
        },
      });
  }
}
