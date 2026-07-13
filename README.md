<div align="center">
  <h1>🚀 AstroBet - Plataforma de Apuestas</h1>
  <p>Una plataforma moderna para realizar apuestas deportivas con un backend seguro implementado en Express (Node.js) y Firebase (Firestore).</p>
</div>

## 🛠️ Cómo Iniciar el Proyecto

**Requisitos Previos:** Node.js v18+

1. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Ejecutar la plataforma en desarrollo:
   ```bash
   npm run dev
   ```
   *Esto iniciará tanto el entorno del Frontend (Vite) como el servidor Backend (Express).*

3. Para construir los empaquetados de producción:
   ```bash
   npm run build
   ```

---

## 🔒 Documentación de Seguridad Implementada

El proyecto ha sido recientemente blindado para cumplir con estrictos estándares de seguridad y hardening. A continuación se detallan todas las mejoras y cambios arquitectónicos realizados:

### 1. Criptografía y Sesiones Seguras (REST / Transfer)
- **Hashing de Contraseñas:** Las contraseñas de los usuarios no se guardan en texto plano en la Base de Datos. Se utiliza la librería `bcryptjs` con un Salt de 10 rondas.
- **Autenticación Delegada (JWT):** Tras una validación correcta de credenciales en `/api/login`, el backend firma y emite un token **JSON Web Token (JWT)**.
- **Autorización de Endpoints:** Todas las operaciones críticas en el frontend (Apostar, Retirar fondos, Acciones Administrativas) requieren inyectar el token como cabecera `Authorization: Bearer <token>`, el cual es verificado por el middleware del backend.

### 2. Inventario de Activos y Logs Estructurados
- Se abandonó el uso de simple `console.log`. Ahora el backend implementa monitoreo profesional utilizando `winston` y `morgan`.
- Las peticiones HTTP y los errores son interceptados y guardados sistemáticamente en los archivos `logs/app.log` y `logs/error.log` para permitir trazabilidad, inventario y auditorías.

### 3. Hardening en Producción
- **Helmet:** Activado globalmente para inyectar cabeceras HTTP seguras y deshabilitar vectores de información como la cabecera `X-Powered-By`.
- **Input Sanitizer (XSS):** Se programó un middleware (en `security.middleware.ts`) que intercepta `req.body`, `req.query` y `req.params`. Cualquier intento de inyección de código malicioso (`<script>`, eventos en línea) o contaminación de prototipos es limpiado automáticamente antes de llegar a la lógica de negocio.
- **CORS Estricto:** Restringido para que solo se acepten peticiones de clientes validados.

### 4. Limitación de Peticiones (Rate Limiting)
- **Prevención de DDoS Básica:** Toda la API cuenta con un limitador general configurado para aceptar máximo **100 peticiones cada 15 minutos** por dirección IP.
- **Anti-Fuerza Bruta en Login:** Se programó un limitador sumamente estricto exclusivo para la ruta `/api/login`, el cual bloquea la IP si realiza **más de 5 intentos fallidos/exitosos en 15 minutos**, protegiendo a los usuarios de ataques de diccionario.

### 5. Ofuscación de Valores Sensibles
- Anteriormente, el endpoint de consulta de perfil (`/api/users/:userId`) devolvía toda la información cruda de la base de datos (incluyendo el hash encriptado de las contraseñas de los usuarios).
- Dicha ruta **fue asegurada** (requiere JWT) y la información de la base de datos es **ofuscada** (`delete user.password`) antes de enviarse al frontend, evitando la fuga de credenciales.
- Se aseguraron los endpoints de administración de partidos, protegiendo las funcionalidades de manipulación de resultados.

---

> **Nota para Desarrolladores:** Si se están utilizando usuarios de Firebase creados antes de la implementación de `bcryptjs`, estos no podrán iniciar sesión ya que sus contraseñas no están hasheadas. Por favor, registrar nuevas cuentas mediante la interfaz web (opción: "Autocompletar con Datos Ficticios") para operar el sistema de manera óptima.
