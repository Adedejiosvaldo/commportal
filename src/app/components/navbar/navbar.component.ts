import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  protected readonly activeRole = signal<string>('Broker View');
  protected readonly isRoleMenuOpen = signal<boolean>(false);

  constructor(private router: Router) {}

  protected toggleRoleMenu() {
    this.isRoleMenuOpen.set(!this.isRoleMenuOpen());
  }

  protected selectRole(role: string, route: string) {
    this.activeRole.set(role);
    this.isRoleMenuOpen.set(false);
    this.router.navigate([route]);
  }
}
