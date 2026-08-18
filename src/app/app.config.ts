import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';

// Factory function to configure the font set before the app boots up
export function initializeIcons(iconRegistry: MatIconRegistry) {
  return () => {
    iconRegistry.setDefaultFontSetClass('material-symbols-outlined');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    // Registers Material Symbols Outline as the default font set
    {
      provide: APP_INITIALIZER,
      useFactory: initializeIcons,
      deps: [MatIconRegistry],
      multi: true,
    },
  ],
};
