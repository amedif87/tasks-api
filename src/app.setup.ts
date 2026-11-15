import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Configuración compartida entre main.ts y los tests e2e (para probar lo mismo que se ejecuta). */
export function setupApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos desconocidos...
      forbidNonWhitelisted: true, // ...y los rechaza con 400 en vez de ignorarlos en silencio
      transform: true,
    }),
  );
  return app;
}
