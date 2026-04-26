# 🚀 Guía Técnica: Automatización del Onboarding (Dossier de Despegue)

Esta guía detalla cómo configurar el flujo de trabajo en n8n para recibir los datos técnicos de los clientes desde el formulario `onboarding.html`.

---

## 1. Configuración de n8n (Workflow)

El flujo se compone de 2 nodos principales: **Webhook** y **Google Sheets**.

### Nodo 1: Webhook (El Receptor)
*   **HTTP Method:** `POST`
*   **Path:** `ops-dining-onboarding`
*   **Response Mode:** `onReceived` (Para dar respuesta inmediata al cliente).
*   **Opciones (CORS):** IMPORTANTE. En la pestaña 'Options' añade:
    *   `Access-Control-Allow-Origin`: `*`
    *   `Access-Control-Allow-Methods`: `GET, POST, OPTIONS`
    *   `Access-Control-Allow-Headers`: `Content-Type, Authorization`

### Nodo 2: Google Sheets (El Almacén)
*   **Resource:** `Row`
*   **Operation:** `Append`
*   **Document ID:** El ID de tu Excel (el código largo de la URL).
*   **Sheet Name:** `Hoja 1` (o el nombre de tu pestaña).
*   **Mapping Column Mode:** `Map Each Column Manually`.
*   **Mapping:** Arrastra los campos que recibes del Webhook a las columnas correspondientes del Excel.

---

## 2. Preparación del Google Sheets

Para que el mapeo sea automático, tu Excel debe tener estos encabezados en la primera fila:

> `Nombre Comercial, Razón Social, CIF/NIF, WhatsApp Negocio, Dirección, Software Reservas, API Key Reservas, WhatsApp Token, WhatsApp Phone ID, Google Sheet ID, Google Service Email, Horarios, URL Menú, Preguntas Frecuentes, Política Cancelación, Tono Asistente, Nombre Asistente, Frase Cierre`

---

## 3. Guía de Obtención de APIs (Para el Cliente)

Aquí tienes el resumen de dónde sale cada dato para que se lo expliques a tus clientes:

1.  **Software de Reservas API:** El cliente debe pedirla al soporte de su software (CoverManager, TheFork, etc.).
2.  **WhatsApp Cloud API (Access Token):** Se obtiene en el panel de [Meta for Developers](https://developers.facebook.com/). Hay que crear una App de tipo "Business" y añadir el producto "WhatsApp".
3.  **WhatsApp Phone Number ID:** Aparece en la sección "Configuración de WhatsApp" dentro del panel de Meta.
4.  **Google Service Account Email:** Se crea en [Google Cloud Console](https://console.cloud.google.com/) > IAM & Admin > Service Accounts. Es un email tipo `agencia@proyecto.iam.gserviceaccount.com`. **El cliente debe compartir su Excel con este email**.

---

## 4. Cómo Probar el Sistema (The Master Test)

Para verificar que todo funciona sin tener que rellenar el formulario a mano, abre n8n, dale a **"Execute Workflow"** y lanza este comando desde tu terminal (PowerShell):

```powershell
$json = @{
  nombre_comercial = "Prueba Agencia"
  razon_social = "Agencia S.L."
  cif = "B00000000"
  whatsapp_empresa = "600000000"
  direccion = "Calle Inventada 123"
  software_reservas = "CoverManager"
  api_key_reservas = "TEST_KEY_123"
  whatsapp_token = "EAAB_TEST_TOKEN"
  whatsapp_phone_id = "123456789"
  google_sheet_id = "ID_DEL_EXCEL"
  google_service_email = "test@serviceaccount.com"
  horarios = "L-D 10-22h"
  url_menu = "https://link.com/menu"
  faq_clientes = "Preguntas de prueba"
  reglas_cancelacion = "24 horas"
  tono_asistente = "tu"
  nombre_asistente = "Sofía AI"
  frase_cierre = "¡Hasta pronto!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://n8n.opsdining.com/webhook-test/ops-dining-onboarding" -Method Post -ContentType "application/json" -Body $json
```

---

## 5. Notas Finales de Seguridad
*   Asegúrate de que el archivo `assets/js/onboarding-handler.js` apunta a la URL correcta de tu n8n.
*   En producción (Hostinger), recuerda usar siempre la URL que **NO** contiene la palabra `-test` (ejemplo: `https://n8n.opsdining.com/webhook/...`).

---
✨ **Ops Dining - Onboarding Engine**
