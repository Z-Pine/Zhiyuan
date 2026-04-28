# 启动开发服务器的脚本
# 解决CSP问题

Write-Host "正在启动Flutter Web开发服务器..." -ForegroundColor Green

# 关闭所有Chrome进程（可选，如果遇到CSP问题）
# Write-Host "关闭现有Chrome进程..." -ForegroundColor Yellow
# Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force

# 启动Flutter
flutter run -d chrome --web-port=8080 `
  --web-browser-flag="--disable-web-security" `
  --web-browser-flag="--user-data-dir=C:\temp\chrome-dev-profile" `
  --web-browser-flag="--disable-features=IsolateOrigins,site-per-process"
