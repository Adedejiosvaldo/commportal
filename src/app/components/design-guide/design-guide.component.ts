import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface ColorToken {
  name: string;
  varName: string;
  hex: string;
  description: string;
}

@Component({
  selector: 'app-design-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './design-guide.component.html'
})
export class DesignGuideComponent {
  protected readonly selectedFont = signal<'sans' | 'manrope' | 'jakarta'>('sans');
  protected readonly activeSection = signal<string>('colors');
  protected readonly copiedToken = signal<string | null>(null);

  protected readonly colorTokens: ColorToken[] = [
    { name: 'Surface', varName: '--color-surface', hex: '#FBF8FF', description: 'Base interface surface with subtle warm off-white tint' },
    { name: 'Surface Low', varName: '--color-surface-container-low', hex: '#F4F2FD', description: 'Soft background for grouped cards' },
    { name: 'Primary', varName: '--color-primary', hex: '#870000', description: 'Signature deep red for executive brand authority' },
    { name: 'Primary Container', varName: '--color-primary-container', hex: '#B30000', description: 'High-intent primary action buttons and CTAs' },
    { name: 'Secondary', varName: '--color-secondary', hex: '#5F5E5F', description: 'Medium gray for secondary UI elements & icons' },
    { name: 'On Surface', varName: '--color-on-surface', hex: '#1A1B22', description: 'Primary high-legibility body text color' },
    { name: 'Outline Variant', varName: '--color-outline-variant', hex: '#E6BDB7', description: 'Subtle light warm border for inputs and cards' }
  ];

  protected setFont(font: 'sans' | 'manrope' | 'jakarta') {
    this.selectedFont.set(font);
  }

  protected copyToken(token: ColorToken) {
    navigator.clipboard.writeText(`${token.varName}: ${token.hex};`);
    this.copiedToken.set(token.name);
    setTimeout(() => this.copiedToken.set(null), 2000);
  }

  protected scrollTo(id: string) {
    this.activeSection.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
