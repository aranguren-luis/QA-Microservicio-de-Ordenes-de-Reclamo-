# Minuta - Sesión de Pruebas Manuales en Entorno Controlado (Idempotencia ,Colas , SAE) del Microservicio de Órdenes de Reclamo

## Información General

| Campo | Detalle |
|-------|---------|
| **Plataforma** | Microsoft Teams |
| **Entorno de pruebas** | Servidor Redis: `<SERVIDOR_MOCK>:<PUERTO>` (vía Docker CLI) |
| **Estado** | Finalizada |

---

## Asistentes

| Nombre | Rol | Presencia |
|--------|-----|-----------|
| **Desarrollador** | Desarrollador | Presente |
| **QA Engineer** | QA | Presente |
| **QA Engineer 2** | QA | Presente |

---

## Objetivo de la Reunión

Ejecutar y validar manualmente los casos de prueba críticos para el microservicio de **Órdenes de Reclamo**, con un enfoque central en el comportamiento del **Indepotencia Key** y las colas Bull.

**Nota sobre la ejecución manual:** Esta sesión fue estrictamente manual y obligatoria debido a la naturaleza de las pruebas. Se requirió un **entorno controlado** y la capacidad de realizar **monitoreo en tiempo real** sobre el estado interno de las claves de Redis (específicamente, el decremento de los TTL, la reutilización de claves y la transición de trabajos entre colas `wait`, `active` y `completed`).

---

## 1. Ejecución Técnica de la Prueba (Validación de Idempotencia y Colas Bull)

A continuación, se detalla la ejecución técnica llevada a cabo mediante la terminal de Redis (`Redis CLI`) para verificar el estado de las claves y el comportamiento de las colas.

### 1.1 Verificación de existencia de claves y colas
Se ejecutó el comando `KEYS idempotency:*` y `KEYS bull:orders-queue:*`. Se confirmó la presencia de las claves correspondientes a las pruebas:

- **Claves de Idempotencia:** `idempotency:request:...:QA-PRUEBAS`, `idempotency:request:...:QA-PRUEBAS-NEW`, y `idempotency:request:...:DEMO-13.8.2026`.
- **Claves de la cola Bull:** `bull:orders-queue:completed`, `bull:orders-queue:wait`, `bull:orders-queue:stalled-check`, `bull:orders-queue:QA-PRUEBAS` y `bull:orders-queue:QA-PRUEBAS-NEW`.

### 1.2 Validación de expiración y reutilización del `Idempotency Key` (Prueba TTL)
Se validó el flujo de la clave `idempotency:request:...:QA-PRUEBAS-NEW`, ejecutando el comando `TTL` en distintos momentos:

- **Resultado del TTL inicial:** `0` (la clave estaba a punto de expirar).
- **Renovación en tiempo real:** Tras disparar la interacción, el `TTL` decrementó secuencialmente de `22` → `21` → `19` → `17`, confirmando la reactivación exitosa de la clave con el tiempo de vida configurado.
- **Eliminación final:** Posteriormente, el `TTL` arrojó `-2`, demostrando que la clave de idempotencia fue eliminada al expirar su ciclo de vida, validando así el mecanismo de limpieza del flujo de la orden.

### 1.3 Validación del TTL configurado para pruebas de 64 segundos
De acuerdo con lo decidido en la reunión, se ajustó la variable `REDIS_INDEPOTENCIA_TTL` a `64` segundos. Al consultar la clave de idempotencia del escenario `idempotency:request:...:QA-PRUEBAS`, el comando `TTL` arrojó los siguientes valores consistentes y decrecientes:

`86012`, `86009`, `86008`, `86006`, `86005` segundos.

Estos resultados confirman que el cambio en la variable de entorno se aplicó correctamente en el microservicio, estableciendo el tiempo de vida de la clave en aproximadamente 24 horas (86000+ segundos) para pruebas de larga duración.

### 1.4 Validación de la cola de trabajos completados en Bull
Se inspeccionó el conjunto ordenado de trabajos finalizados mediante el comando:
`ZRANGE bull:orders-queue:completed 0 -1 WITHSCORES`

El resultado confirmó que tanto `QA-PRUEBAS` como `QA-PRUEBAS-NEW` se encuentran correctamente registrados dentro del conjunto de trabajos terminados, acompañados de las marcas de tiempo (`timestamps`): `1786626400317` y `1786627003764`, respectivamente.

### 1.5 Validación del payload de idempotencia
Se ejecutó el comando `GET idempotency:request:...:QA-PRUEBAS` para verificar el contenido persistido.

- **Payload devuelto:** `"{\"Order creation process initiated\",\"status\":\"queued\"}"`
- **Conclusión técnica:** El sistema de idempotencia persiste correctamente el estado de la solicitud como `"queued"` (en cola), correspondiente al inicio exitoso del proceso de creación de la orden.

### 1.6 Observaciones y anomalías registradas
- **Inconsistencia en el comando SCAN**: Al ejecutar `SCAN 0 MATCH bull:orders-queue:* COUNT 100`, el sistema devolvió `(empty array)`, por lo que queda registrada como una observación para futuras validaciones de escaneo.

---

## 2. Temas Tratados y Decisiones del Equipo

### 2.1 Dificultades con herramientas de monitoreo de Redis
- Se intentó usar **Redis Insight** para visualizar colas, pero presentó un gran retraso (no mostraba datos en tiempo real).
- Se probaron alternativas como **TablePlus** (falló por plugins desactivados), **Another Redis Desktop Manager** (pesado y lento) y **Datagrip** (requirió permisos de administrador y no funcionó correctamente).
- **Decisión del equipo**: Se optó por usar la **Redis CLI vía terminal (Docker)** para ejecutar consultas en tiempo real, tal como se documenta en la sección de ejecución técnica.

### 2.2 Ajuste del TTL en entorno de pruebas
- El TTL original era de **86400 segundos (24 horas)**. Para agilizar las pruebas de ciclo de vida, se modificó la variable de entorno `REDIS_INDEPOTENCIA_TTL` a **64 segundos**.
- Tras un nuevo despliegue y las validaciones técnicas del punto 1.3, se confirmó que el cambio surtió efecto.
- **Decisión**: Dejar el TTL en 64 segundos únicamente para el entorno de pruebas. En el ambiente de producción se mantendrá el valor original de 24 horas.

### 2.3 Revisión de reportes de pruebas automatizadas
- Se detectaron **falsos negativos** en reportes previos debido a la validación de respuestas esperadas.
- En algunos casos, el reporte esperaba un código `422` pero el API devolvía `404`. El equipo confirmó que la respuesta `404` es correcta porque el Gateway rechaza la petición antes de que llegue al microservicio.
- **Decisión**: actualizar los esquemas de validación en las pruebas automatizadas para que reflejen fielmente el comportamiento real del Gateway y el API.

---

## 3. SAE



| TC | Descripción | Estado / Acción |
|------------|-------------|-----------------|
| **TC-027** | Enviar un body válido a una empresa **DO** → `201` con el envelope de éxito; el worker reporta a SAE con el mapeo correcto (`id_det_orden = orderDetailId`, `detalle_orden = orderDetails`, `id_contrato = contractId`, `Cedula = nationalId`, `Lic = SAE_LICENSE_DO`) | **En espera de dato de prueba** |
| **TC-028** | Enviar un body válido a una empresa **PE** → `201` con el envelope de éxito; el worker reporta a SAE con el mismo mapeo y `Lic = SAE_LICENSE_PE` | **En espera de dato de prueba** |
| **TC-029** | Enviar un body válido a una empresa **VE** → `201` con el envelope de éxito; el worker reporta a SAE con el mismo mapeo y `Lic = SAE_LICENSE_VE` | **Correcto** |
| **TC-030** | Enviar un body válido → `201` con el envelope de éxito; el worker envía a SAE los headers `Api-Token` y `Api-Connect` correctos para la región | **Correcto** |

---

## 4. Evidencias

| # | Evidencia |
|---|-----------|
| 1 | ![Evidencia 1](./evidence/1.png) |
| 2 | ![Evidencia 2](./evidence/2.png) |
| 3 | ![Evidencia 3](./evidence/3.png) |
| 4 | ![Evidencia 4](./evidence/4.png) |
| 5 | ![Evidencia 5](./evidence/5.png) |
| 6 | ![Evidencia 6](./evidence/6.png) |
