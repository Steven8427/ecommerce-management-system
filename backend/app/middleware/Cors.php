<?php
namespace app\middleware;

/**
 * 跨域中间件
 */
class Cors
{
    public function handle($request, \Closure $next)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        // 处理 OPTIONS 预检请求
        if ($request->method(true) == 'OPTIONS') {
            return response('', 200);
        }
        
        return $next($request);
    }
}
