<?php
use think\facade\Route;

// 认证 API（不需要token）
Route::group('auth', function () {
    Route::post('login', 'Auth/login');
    Route::post('register', 'Auth/register');
    Route::get('check-setup', 'Auth/checkSetup');
    Route::get('info', 'Auth/info');
    Route::post('logout', 'Auth/logout');
    Route::get('users', 'Auth/userList');
    Route::post('update-permissions', 'Auth/updatePermissions');
    Route::post('update-role', 'Auth/updateRole');
    Route::post('update-status', 'Auth/updateStatus');
    Route::delete('user/:id', 'Auth/deleteUser');
    Route::post('change-password', 'Auth/changePassword');
    Route::post('reset-password', 'Auth/resetPassword');
});

// 耗材分类 API（供销售单选材使用）
Route::group('product', function () {
    Route::get('categories', 'Product/categories');
    Route::post('category/add', 'Product/addCategory');
    Route::delete('category/delete/:id', 'Product/deleteCategory');
});

// 客户管理 API
Route::group('customer', function () {
    Route::get('list', 'Customer/index');
    Route::post('add', 'Customer/add');
    Route::put('update/:id', 'Customer/update');
    Route::delete('delete/:id', 'Customer/delete');
    Route::get('debts', 'Customer/debts');
    Route::get('levels', 'Customer/levels');
    Route::post('level/add', 'Customer/addLevel');
    Route::put('level/update/:id', 'Customer/updateLevel');
    Route::delete('level/delete/:id', 'Customer/deleteLevel');
});

// 销售订单 API
Route::group('sales', function () {
    Route::get('list', 'SalesOrder/index');
    Route::post('create', 'SalesOrder/create');
    Route::post('update/:id', 'SalesOrder/update');
    Route::get('detail/:id', 'SalesOrder/detail');
    Route::delete('delete/:id', 'SalesOrder/delete');
    Route::post('status/:id', 'SalesOrder/updateStatus');
});

// 数据统计 API
Route::group('stats', function () {
    Route::get('overview', 'Stats/overview');
    Route::get('customer-ranking', 'Stats/customerRanking');
    Route::get('product-ranking', 'Stats/productRanking');
});

// 收款二维码 API
Route::group('qrcode', function () {
    Route::get('list', 'QrCode/list');
    Route::post('add', 'QrCode/add');
    Route::post('update/:id', 'QrCode/update');
    Route::delete('delete/:id', 'QrCode/delete');
});

// 文件上传 API
Route::post('upload/image', 'Upload/image');

// 前端页面 - 所有非 API 请求返回 React 入口
Route::get('/', function () {
    return response(file_get_contents(app()->getRootPath() . 'public/build/index.html'));
});
Route::miss(function () {
    $path = app()->getRootPath() . 'public/build/index.html';
    if (file_exists($path)) {
        return response(file_get_contents($path));
    }
    return json(['code' => 404, 'message' => 'Not Found']);
});
