import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Configuración compartida entre main.ts y los tests e2e (para probar lo mismo que se ejecuta). */
export function setupApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos desconocidos...
      forbidNonWhitelisted: true, // ...y los rechaza con 400 en vez de ignorarlos en silencio
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Tasks API')
    .setDescription('API REST para gestionar tareas. Usa Try it out para ejecutar peticiones.')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config), {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: { displayRequestDuration: true },
  });
  return app;
}
