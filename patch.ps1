Get-ChildItem -Filter *.html | ForEach-Object {
    $content = Get-Content $_ -Raw
    $content = $content -replace '"SENTADO":    \{ bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" \},', " "SENTADO":    { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
            "FINALIZADA": { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-400 font-extrabold", border: "border-yellow-400 dark:border-yellow-600 shadow-sm shadow-yellow-500/40" },"
    $content = $content -replace 'if\(label === "SENTADO"\) return ''#3b82f6'';', "if(label === "SENTADO") return '#3b82f6';
                if(label === "FINALIZADA") return '#eab308';"
    Set-Content $_ $content -NoNewline
}
