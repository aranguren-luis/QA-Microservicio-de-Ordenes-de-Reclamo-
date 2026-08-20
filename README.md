<div align="center">

# QA Microservicio de Ordenes de Reclamo

**Pruebas E2E de API · Playwright · TypeScript · Bun**

</div>

---

## Badges de Tecnologias

![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-14151A?style=for-the-badge&logo=bun&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

---

## Tech Stack QA

| Categoria | Tecnologia | Uso |
|:----------|:-----------|:----|
| **Framework de pruebas** | Playwright | APIRequestContext (sin navegador) |
| **Lenguaje** | TypeScript | Tipado estatico para mayor robustez |
| **Runtime** | Bun | Ejecucion rapida de pruebas |
| **Autenticacion** | Keycloak | OAuth2 client_credentials |
| **Backend** | NestJS | Microservicio bajo prueba |
| **Cache/Colas** | Redis + Bull | Idempotencia y procesamiento asincrono |
| **Reportes** | HTML personalizado | Assertion Reporter con tarjetas colapsables |

---

## Tecnicas de QA Aplicadas

| Tecnica | Descripcion |
|:--------|:------------|
| **API Testing** | Pruebas E2E directas sobre endpoints REST sin navegador |
| **Data-Driven Testing** | Payloads parametrizados para multiples escenarios de validacion |
| **Boundary Analysis** | Tests de limites (body >100KB, campos de 5000+ chars, keys de 200+ chars) |
| **Security Testing** | Path traversal, tokens invalidos, Bearer malformado |
| **Idempotency Validation** | Verificacion de cache de idempotencia y comportamiento de throttling |
| **Negative Testing** | Validacion de respuestas de error (400, 401, 403, 404, 422, 429) |
| **Contract Testing** | Validacion de envelope { data, error, meta } en todas las respuestas |
| **Rate Limiting Testing** | Validacion de comportamiento ante throttle (5 req/min por IP) |

---

## Project Structure

```
QA-Microservicio-de-Ordenes-de-Reclamo-/
├── config/
│   └── playwright.config.ts       # Configuracion de Playwright
├── fixtures/
│   ├── auth.ts                    # Autenticacion Keycloak (client_credentials)
│   ├── companies.ts               # UUIDs de empresas de prueba (DO, PE, VE)
│   ├── env.ts                     # Variables de entorno y defaults
│   └── payloads.ts                # Payloads validos e invalidos
├── helpers/
│   ├── client.ts                  # Cliente API con throttle y Bearer automatico
│   ├── envelope.ts                # Validadores de envelope { data, error, meta }
│   ├── idempotency.ts             # Generador de Idempotency-Key
│   └── throttle.ts                # Control de rate limiting (5 req/min)
├── tests/
│   └── orders.spec.ts             # Suite de pruebas automatizadas
├── reports/                       # Reportes generados
├── scripts/                       # Scripts de automatizacion
└── package.json
```

---

## Test Coverage

### Secciones de Prueba

| Seccion | Casos | Tipo | Endpoint |
|:--------|:------|:-----|:---------|
| **Auth / Headers** | TC-001 a TC-006 | Positivo/Negativo | POST /v2/companies/{companyId}/orders |
| **Validacion DTO** | TC-008 a TC-015b | Negativo/Borde | POST /v2/companies/{companyId}/orders |
| **CompanyValidationPipe** | TC-015 a TC-019 | Negativo | POST /v2/companies/{companyId}/orders |
| **Idempotencia HTTP** | TC-020 a TC-023 | Positivo/Borde | POST /v2/companies/{companyId}/orders |
| **Throttling y Quota** | TC-025, TC-026 | Negativo | POST /v2/companies/{companyId}/orders |

### Metricas

| Metrica | Valor |
|:--------|:------|
| Total casos automatizados | **22** |
| Aserciones totales | **85+** |
| Casos manuales | **2** |
| Categorias cubiertas | **4** |
| Bugs documentados | **5** (BUG-001 a BUG-005) |

---

## How to Run

### Requisitos

- Node 18+
- Bun (recomendado) o npm

### Instalacion

```bash
git clone https://github.com/aranguren-luis/QA-Microservicio-de-Ordenes-de-Reclamo-.git
cd QA-Microservicio-de-Ordenes-de-Reclamo-
bun install
```

### Ejecutar Pruebas

```bash
# Ejecutar toda la suite de pruebas
bun run test:api

# Abrir reporte HTML en navegador
bun run test:api:report

# Regenerar reporte QA
bun run test:api:reporte
```

### Variables de Entorno

| Variable | Default | Descripcion |
|:---------|:--------|:------------|
| `BASE_URL` | `https://api.qa.mock.com` | URL base del microservicio |
| `KEYCLOAK_AUTH_SERVER_URL` | `https://kms.qa.mock.com` | URL del servidor Keycloak |
| `KEYCLOAK_REALM` | `mock-realm` | Realm de Keycloak |
| `KEYCLOAK_CLIENT_ID` | `ordenes-reclamo` | Client ID de Keycloak |
| `KEYCLOAK_CLIENT_SECRET` | `<PLACEHOLDER>` | Client Secret de Keycloak |
| `COMPANY_ID_DO` | UUID mock | UUID de empresa Dominicana |
| `COMPANY_ID_PE` | UUID mock | UUID de empresa Peruana |
| `COMPANY_ID_VE` | UUID mock | UUID de empresa Venezolana |

---

## Documentacion

| Documento | Descripcion | Link |
|:----------|:------------|:-----|
| **Reporte QA** | Reporte completo con plan de pruebas y resultados | [Ver Reporte QA](https://aranguren-luis.github.io/QA-Microservicio-de-Ordenes-de-Reclamo-/qa-report.html) |
| **Reporte de Aserciones** | Detalle PASS/FAIL por caso de prueba | [Ver Reporte de Aserciones](https://aranguren-luis.github.io/QA-Microservicio-de-Ordenes-de-Reclamo-/assertion-report.html) |
| **Minuta de Pruebas** | Documentacion de sesion de pruebas manuales | [Ver Minuta](https://aranguren-luis.github.io/QA-Microservicio-de-Ordenes-de-Reclamo-/minutes.html) |

---

## Notas Tecnicas

- El endpoint esta limitado a **5 req/min por IP** (ThrottlerGuard)
- La suite completa tarda aproximadamente **7 minutos** debido al throttling
- TC-025 y TC-026 son manuales y no se ejecutan en la suite automatizada

---

<div align="center">

**QA Engineering · Playwright · API Testing · TypeScript**

</div>
