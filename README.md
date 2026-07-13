🦷 Apolodigital Dental — Frontend
Frontend del SaaS Odontológico Apolodigital Dental, diseñado para clínicas y profesionales de odontología que necesitan una plataforma moderna, rápida y segura para gestionar pacientes, historias clínicas, agenda, facturación y más.

🚀 Tecnologías principales
React + Vite — Renderizado ultrarrápido y DX moderna

TailwindCSS — Estilos consistentes y productivos

React Router — Navegación SPA

Axios / Fetch — Consumo de API

FastAPI Backend (API REST)

Docker Ready (opcional)

Deploy en Vercel / Railway

📦 Instalación y ejecución
1. Clonar el repositorio
bash
git clone https://github.com/Charango7369/dental-frontend.git
cd dental-frontend
2. Instalar dependencias
bash
npm install
3. Variables de entorno
Crear un archivo .env basado en .env.example:

Código
VITE_API_URL=http://localhost:8000
4. Ejecutar en modo desarrollo
bash
npm run dev
5. Build de producción
bash
npm run build
🗂️ Estructura del proyecto
Código
dental-frontend/
│
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── context/
│   ├── services/   # Axios / API calls
│   ├── utils/
│   └── assets/
│
├── .env.example
├── package.json
├── vite.config.js
└── README.md
🔌 Integración con API FastAPI
El frontend consume la API del backend odontológico:

Autenticación JWT

Gestión de pacientes

Historias clínicas

Agenda y citas

Facturación y reportes

Roles y permisos

Ejemplo de cliente API:

javascript
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
🧪 Testing (opcional)
Si deseas agregar pruebas:

Vitest

React Testing Library

bash
npm install -D vitest @testing-library/react
🧱 Buenas prácticas del proyecto
Commits con convención Conventional Commits

Ramas: main, dev, feature/*

Pull Requests con revisión

Linter + Prettier (opcional)

Versionado semántico

📤 Deploy
Vercel (recomendado)
Importar repo

Framework: Vite

Variables de entorno

Build: npm run build

Output: dist/

Railway / Docker
Si usas Docker:

dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "run", "preview"]
📄 Licencia
Este proyecto forma parte del ecosistema Apolodigital.
Si deseas hacerlo público, usa MIT License.


👨‍💻 Autor
Edwin José Rivero Antezana — CTO Pragmatico de Apolodigital  
Optimización tecnológica para negocios locales y desarrollo de sistemas SaaS.