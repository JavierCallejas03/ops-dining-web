$headers = @{
    "apikey" = "OpsDining2026"
    "Content-Type" = "application/json"
}
$body = @{
    "webhook" = @{
        "enabled" = $true
        "url" = "http://178.104.234.176:5678/webhook/recepcionista-ops-v1"
        "events" = @("MESSAGES_UPSERT")
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://178.104.234.176:8082/webhook/set/OpsDiningPro" -Method Post -Headers $headers -Body $body
