# Humana-Mente — prototipo local

Prototipo frontend de gestión para consulta psicológica particular, inspirado en una experiencia de progreso gamificada.

## Requisitos
- Node.js 18 o superior
- npm

## Cómo levantarlo
1. Descomprime la carpeta.
2. Abre una terminal.
3. Instala dependencias:

   ```bash
   npm install
   ```

4. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre en el navegador la URL que Vite indique (normalmente http://localhost:5173).

## Modificar
- `src/main.jsx`: componentes, navegación y comportamiento React.
- `src/styles.css`: colores, estilos, responsive y diseño.
- `package.json`: dependencias y comandos.

## Alcance actual
Es un prototipo UI con datos ficticios. Pacientes, fichas, agenda, hojas y logros se guardan en el `localStorage` de este navegador; se pueden borrar con "Reiniciar datos de prueba" en Progreso. El botón de voz es una simulación visual; no activa micrófono ni transcribe. No ingresar datos reales o sensibles de pacientes.

## Build
```bash
npm run build
```
