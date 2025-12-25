# Salud Digital - Expediente Clínico Electrónico

![Salud Digital](httpshttps://i.imgur.com/example.png) 

**Salud Digital** es una plataforma de software como servicio (SaaS) para la gestión de expedientes clínicos electrónicos, diseñada para cumplir con la normativa mexicana **NOM-024-SSA3-2012**. Ofrece una solución integral para profesionales de la salud, permitiendo una administración eficiente, segura y conforme a la ley de la información de los pacientes.

## ✨ Características Principales

- **Gestión de Pacientes**: Registro, búsqueda y actualización de la información demográfica de los pacientes.
- **Expediente Clínico Electrónico (ECE)**: Creación y consulta de notas médicas, signos vitales, recetas y estudios de laboratorio.
- **Seguridad y Cumplimiento**: Autenticación basada en roles, registros de auditoría (bitácoras) y firma electrónica de documentos, en apego a la **NOM-024** y la **Ley Federal de Protección de Datos Personales (LFPDPPP)**.
- **Citas Médicas**: Agendamiento y administración de citas.
- **Catálogo CIE-10**: Búsqueda y asociación de diagnósticos estandarizados.
- **Interfaz Moderna**: Diseño responsivo y amigable, construido con las últimas tecnologías web.

## 🚀 Tecnologías Utilizadas

El proyecto está construido con un stack de tecnologías moderno, robusto y escalable:

- **Frontend**:
  - [**React**](https://react.dev/): Biblioteca para construir interfaces de usuario.
  - [**TypeScript**](https://www.typescriptlang.org/): Tipado estático para un desarrollo más seguro.
  - [**Vite**](https://vitejs.dev/): Herramienta de desarrollo frontend de alta velocidad.
  - [**TanStack Query**](https://tanstack.com/query/latest): Gestión de estado asíncrono y caching de datos.
  - [**Tailwind CSS**](https://tailwindcss.com/): Framework de CSS para un diseño rápido y personalizable.
  - [**shadcn/ui**](https://ui.shadcn.com/): Componentes de UI accesibles y reutilizables.

- **Backend**:
  - [**Node.js**](https://nodejs.org/): Entorno de ejecución para JavaScript del lado del servidor.
  - [**Express**](https://expressjs.com/): Framework minimalista para aplicaciones web y APIs.
  - [**Drizzle ORM**](https://orm.drizzle.team/): ORM "headless" para una interacción segura con la base de datos.
  - [**SQLite**](https://www.sqlite.org/index.html): Base de datos relacional ligera y auto-contenida.

- **Compartido (Shared)**:
  - Definiciones de esquemas y tipos compartidos entre el frontend y el backend para garantizar la consistencia de los datos.

## 📁 Estructura del Proyecto

El monorepo está organizado de la siguiente manera para una clara separación de responsabilidades:

```
/
├── client/         # Aplicación frontend (React + Vite)
│   ├── src/
│   │   ├── components/ # Componentes de UI reutilizables
│   │   ├── pages/      # Vistas principales de la aplicación
│   │   ├── lib/        # Utilidades y configuración
│   │   └── ...
│   └── ...
├── server/         # Aplicación backend (Node.js + Express)
│   ├── auth.ts       # Lógica de autenticación y autorización
│   ├── db.ts         # Configuración de la base de datos
│   ├── routes.ts     # Definición de las rutas de la API
│   ├── storage.ts    # Abstracción del acceso a datos (repositorio)
│   └── ...
├── shared/         # Código compartido entre cliente y servidor
│   └── schema.ts     # Esquemas de la base de datos y tipos de datos
└── ...
```

## 🛠️ Instalación y Puesta en Marcha

Para ejecutar el proyecto en un entorno de desarrollo local, sigue estos pasos:

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/tu-usuario/Salud-Digital.git
    cd Salud-Digital
    ```

2.  **Instalar dependencias**:
    Asegúrate de tener [Node.js](https://nodejs.org/) (v18 o superior) instalado.
    ```bash
    npm install
    ```

3.  **Iniciar la aplicación**:
    Este comando iniciará tanto el servidor backend como el cliente de desarrollo simultáneamente.
    ```bash
    npm run dev
    ```
    - El **frontend** estará disponible en `http://localhost:5173`.
    - El **backend** estará disponible en `http://localhost:3000`.

## 🔐 Seguridad y Cumplimiento Normativo

La plataforma ha sido desarrollada teniendo en cuenta los estrictos requisitos de la normativa mexicana:

- **NOM-024-SSA3-2012**: Se implementan mecanismos de seguridad como:
  - **Control de Acceso**: Autenticación por usuario y contraseña, con roles (`admin`, `medico`, `enfermeria`).
  - **Bitácoras de Auditoría**: Registro detallado de todas las acciones críticas (creación, modificación, eliminación y consulta de datos sensibles).
  - **Inmutabilidad de Registros**: Las notas médicas firmadas no pueden ser alteradas.
  - **Firma Electrónica**: Se genera un hash único para firmar digitalmente las notas médicas, garantizando su integridad.

- **LFPDPPP**: Se gestiona el consentimiento del paciente para el tratamiento de sus datos personales y del expediente clínico a través de registros de consentimiento.

## 📄 API Endpoints

El servidor expone una API REST para interactuar con los datos. Todos los endpoints requieren autenticación.

| Método | Ruta                         | Descripción                                     | Rol Requerido        |
| :----- | :--------------------------- | :---------------------------------------------- | :------------------- |
| `POST` | `/api/login`                 | Inicia sesión y obtiene un token de sesión.     | Público              |
| `POST` | `/api/logout`                | Cierra la sesión del usuario.                   | Autenticado          |
| `GET`  | `/api/patients`              | Obtiene la lista de todos los pacientes.        | `medico`, `enfermeria` |
| `POST` | `/api/patients`              | Registra un nuevo paciente.                     | `medico`, `enfermeria` |
| `GET`  | `/api/patients/:id`          | Obtiene los detalles de un paciente específico. | `medico`, `enfermeria` |
| `PATCH`| `/api/patients/:id`          | Actualiza la información de un paciente.        | `medico`, `enfermeria` |
| `DELETE`| `/api/patients/:id`        | Elimina un paciente del sistema.                | `medico`, `enfermeria` |
| `GET`  | `/api/patients/:id/notes`    | Obtiene todas las notas médicas de un paciente. | `medico`, `enfermeria` |
| `POST` | `/api/notes`                 | Crea una nueva nota médica.                     | `medico`             |
| `POST` | `/api/notes/:id/sign`        | Firma electrónicamente una nota médica.         | `medico`             |
| `GET`  | `/api/audit-logs`            | Consulta la bitácora de auditoría del sistema.  | `admin`              |

*Esta es una lista parcial. Consulta `server/routes.ts` para ver todos los endpoints disponibles.*

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar el proyecto, por favor, abre un *issue* o envía un *pull request*.

---

Hecho con ❤️ por el equipo de Salud Digital.
