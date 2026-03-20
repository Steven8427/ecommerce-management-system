@echo off
chcp 65001 >nul
title HS - 电商管理系统

echo ============================================
echo    电商管理系统 - 一键启动
echo ============================================
echo.

echo [1/2] 启动后端 PHP 服务器 (端口 106)...
start "HS-Backend" cmd /k "title HS-Backend && color 0A && echo 后端服务器启动中... && "D:\phpEnv\phpEnv\php\php-7.4\php.exe" -S 127.0.0.1:106 -t "%~dp0backend\public" "%~dp0backend\public\router.php""

timeout /t 2 /nobreak >nul

echo [2/2] 启动前端 React 开发服务器 (端口 3000)...
start "HS-Frontend" cmd /k "title HS-Frontend && color 0B && cd /d "%~dp0frontend" && npm start"

echo.
echo ============================================
echo    启动完成！
echo    后端: http://127.0.0.1:106
echo    前端: http://localhost:3000
echo ============================================
echo.
echo 关闭此窗口不会影响服务器运行
echo 要停止服务器，关闭 HS-Backend 和 HS-Frontend 窗口即可
pause
