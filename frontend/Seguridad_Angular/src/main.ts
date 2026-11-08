// Punto de entrada principal de Angular.
// Inicia la aplicación utilizando la configuración global.

import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((error) => console.error(error));