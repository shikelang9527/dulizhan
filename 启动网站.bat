@echo off
chcp 936 >nul
cd /d "%~dp0"
echo ============================================
echo   MewMew Co 宠物独立站 - 一键启动(公网)
echo ============================================
echo.
start "MewMew-网站服务器" cmd /k "node server.js"
timeout /t 3 /nobreak >nul
start "MewMew-公网隧道" cmd /k "tools\cloudflared.exe tunnel --url http://localhost:4180 --no-autoupdate"
echo 已启动两个窗口:
echo.
echo   1. 本机访问:  http://localhost:4180
echo   2. 公网地址:  看[MewMew-公网隧道]窗口里
echo      trycloudflare.com 结尾的网址(需等5-10秒)
echo.
echo 注意:
echo   - 关掉那两个窗口 = 网站下线
echo   - 公网地址每次重启都会变化
echo   - 正式运营请按 README.md 部署到云主机
echo.
pause
