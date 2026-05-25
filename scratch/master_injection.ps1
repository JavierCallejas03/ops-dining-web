$headers = @{
    "X-N8N-API-KEY" = "n8n_api_5a855909193240a5a315e985448373a0"
    "Content-Type" = "application/json"
}

# 1. El JSON perfecto del workflow
$workflowData = @{
    name = "Recepcionista Virtual 24/7 (Ops Dining)"
    nodes = @(
        @{
            id = "webhook"
            name = "Webhook"
            type = "n8n-nodes-base.webhook"
            typeVersion = 2.1
            position = @(0, 0)
            parameters = @{
                httpMethod = "POST"
                path = "recepcionista-ops-v1"
            }
        },
        @{
            id = "agent"
            name = "AI Agent"
            type = "@n8n/n8n-nodes-langchain.agent"
            typeVersion = 1.7
            position = @(250, 0)
            parameters = @{
                promptType = "define"
                text = "={{ $json.body.data.message?.conversation || $json.body.data.message?.extendedTextMessage?.text || 'Hola' }}"
                options = @{
                    systemMessage = "Eres la Recepcionista de Ops Dining. Hoy es 6 Mayo 2026. Gestiona reservas de forma profesional. Usa sheets para guardar y whatsapp para responder."
                }
            }
        },
        @{
            id = "model"
            name = "OpenAI Model"
            type = "@n8n/n8n-nodes-langchain.lmChatOpenAi"
            typeVersion = 1.2
            position = @(150, 250)
            credentials = @{ openAiApi = @{ id = "7Yexka0KGrdxkO2D" } }
            parameters = @{ model = "gpt-4o-mini" }
        },
        @{
            id = "memory"
            name = "Simple Memory"
            type = "@n8n/n8n-nodes-langchain.memoryWindowBuffer"
            typeVersion = 1.3
            position = @(350, 250)
            parameters = @{
                sessionId = "={{ $node['Webhook'].json.body.data.key.remoteJid }}"
            }
        },
        @{
            id = "whatsapp"
            name = "WhatsApp Tool"
            type = "@n8n/n8n-nodes-langchain.toolHttpRequest"
            typeVersion = 1.1
            position = @(550, 250)
            parameters = @{
                method = "POST"
                url = "http://178.104.234.176:8082/message/sendText/OpsDiningPro"
                sendHeaders = $true
                headerParameters = @{
                    parameters = @(
                        @{ name = "apikey"; valueProvided = "field"; value = "OpsDining2026" }
                    )
                }
                sendBody = $true
                specifyBody = "json"
                jsonBody = '{"number": "{{ $fromAI.number }}", "text": "{{ $fromAI.text }}"}'
                description = "Envía mensajes de WhatsApp. Necesita 'number' y 'text'."
                specifyFromAI = "manual"
                fromAIProperties = @{
                    properties = @(
                        @{ name = "number"; type = "string"; description = "WhatsApp ID" },
                        @{ name = "text"; type = "string"; description = "Mensaje" }
                    )
                }
            }
        },
        @{
            id = "sheets"
            name = "Sheets Tool"
            type = "@n8n/n8n-nodes-langchain.toolGoogleSheets"
            typeVersion = 1.3
            position = @(550, 400)
            credentials = @{ googleSheetsOAuth2Api = @{ id = "ifZXlwCF9Z1B0f99" } }
            parameters = @{
                operation = "append"
                documentId = @{ mode = "id"; value = "12qHrqtzJMMRMc7ziKJVPbTjJiQY7rCOA9mZ4u28y3ZE" }
                sheetName = @{ mode = "name"; value = "Hoja 1" }
                description = "Consulta o guarda reservas. Columnas: Fecha, Hora, Nombre, Personas, WhatsApp."
            }
        }
    )
    connections = @{
        webhook = @{ main = @(@(@{ node = "agent"; type = "main"; index = 0 })) }
        model = @{ ai_languageModel = @(@(@{ node = "agent"; type = "ai_languageModel"; index = 0 })) }
        memory = @{ ai_memory = @(@(@{ node = "agent"; type = "ai_memory"; index = 0 })) }
        whatsapp = @{ ai_tool = @(@(@{ node = "agent"; type = "ai_tool"; index = 0 })) }
        sheets = @{ ai_tool = @(@(@{ node = "agent"; type = "ai_tool"; index = 0 })) }
    }
}

$body = $workflowData | ConvertTo-Json -Depth 20 -Compress
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/YuofTD2E6qPWmAiV" -Method Put -Headers $headers -Body $body
