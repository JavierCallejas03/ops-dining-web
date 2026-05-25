$headers = @{
    "X-N8N-API-KEY" = "n8n_api_5a855909193240a5a315e985448373a0"
    "Content-Type" = "application/json"
}

# Usar la IP del VPS directamente para evitar problemas de localhost
$wf = Invoke-RestMethod -Uri "http://178.104.234.176:5678/api/v1/workflows/YuofTD2E6qPWmAiV" -Method Get -Headers $headers

foreach ($node in $wf.nodes) {
    if ($node.name -match "WhatsApp") {
        $node.parameters = @{
            "method" = "POST"
            "url" = "http://178.104.234.176:8082/message/sendText/OpsDiningPro"
            "sendHeaders" = $true
            "headerParameters" = @{
                "parameters" = @(
                    @{
                        "name" = "apikey"
                        "valueProvided" = "field"
                        "value" = "OpsDining2026"
                    }
                )
            }
            "sendBody" = $true
            "specifyBody" = "json"
            "jsonBody" = '{"number": "{{ $fromAI.number }}", "text": "{{ $fromAI.text }}"}'
            "description" = "Envia WhatsApp. Params: number, text"
            "specifyFromAI" = "manual"
            "fromAIProperties" = @{
                "properties" = @(
                    @{
                        "name" = "number"
                        "type" = "string"
                        "description" = "WhatsApp ID"
                    },
                    @{
                        "name" = "text"
                        "type" = "string"
                        "description" = "Mensaje"
                    }
                )
            }
        }
    }
}

$wfJson = $wf | ConvertTo-Json -Depth 20 -Compress
Invoke-RestMethod -Uri "http://178.104.234.176:5678/api/v1/workflows/YuofTD2E6qPWmAiV" -Method Put -Headers $headers -Body $wfJson
