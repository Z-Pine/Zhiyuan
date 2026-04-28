$ErrorActionPreference = 'Continue'
$env:NODE_ENV = 'production'

# 设置 DATABASE_URL
$env:DATABASE_URL = "postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

$start = Get-Date
$logFile = Join-Path $PSScriptRoot "import_bg_log.txt"

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 开始后台导入..."

try {
    $proc = Start-Process -FilePath "node" -ArgumentList "scripts/import-all-data.js" -WorkingDirectory $PSScriptRoot -PassThru -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError (Join-Path $PSScriptRoot "import_bg_err.txt")

    # 等待进程，最多25分钟
    $completed = $proc.WaitForExit(1500000)

    $elapsed = (Get-Date) - $start
    $exitCode = $proc.ExitCode

    $log = if (Test-Path $logFile) { Get-Content $logFile -Raw } else { "" }
    $errLog = if (Test-Path (Join-Path $PSScriptRoot "import_bg_err.txt")) { Get-Content (Join-Path $PSScriptRoot "import_bg_err.txt") -Raw } else { "" }

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 进程结束"
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 耗时: $($elapsed.TotalSeconds) 秒"
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 退出码: $exitCode"
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 日志:"
    Write-Host $log
    if ($errLog) { Write-Host "[ERROR]"; Write-Host $errLog }

} catch {
    Write-Host "[ERROR] $_"
}