@echo off
chcp 65001 >nul
echo 正在停止服务器...
taskkill /FI "WINDOWTITLE eq HS-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq HS-Frontend*" /F >nul 2>&1
echo 服务器已停止
timeout /t 2 /nobreak >nul
