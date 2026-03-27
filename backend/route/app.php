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

// 商品模块 API
Route::group('product', function () {
    Route::get('list', 'Product/index');
    Route::post('add', 'Product/add');
    Route::put('update/:id', 'Product/update');
    Route::delete('delete/:id', 'Product/delete');
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
    Route::get('levels', 'Customer/levels');
    Route::post('level/add', 'Customer/addLevel');
    Route::put('level/update/:id', 'Customer/updateLevel');
    Route::delete('level/delete/:id', 'Customer/deleteLevel');
});

// 供应商管理 API
Route::group('supplier', function () {
    Route::get('list', 'Supplier/index');
    Route::post('add', 'Supplier/add');
    Route::put('update/:id', 'Supplier/update');
    Route::delete('delete/:id', 'Supplier/delete');
});

// 销售单 API
Route::group('sales', function () {
    Route::get('list', 'SalesOrder/index');
    Route::post('create', 'SalesOrder/create');
    Route::post('update/:id', 'SalesOrder/update');
    Route::get('history-prices/:id', 'SalesOrder/historyPrices');
    Route::get('detail/:id', 'SalesOrder/detail');
    Route::delete('delete/:id', 'SalesOrder/delete');
});

// 进货单 API
Route::group('purchase', function () {
    Route::get('list', 'PurchaseOrder/index');
    Route::post('create', 'PurchaseOrder/create');
    Route::post('update/:id', 'PurchaseOrder/update');
    Route::get('detail/:id', 'PurchaseOrder/detail');
    Route::delete('delete/:id', 'PurchaseOrder/delete');
});

// 数据统计 API
Route::group('stats', function () {
    Route::get('overview', 'Stats/overview');
    Route::get('customer-ranking', 'Stats/customerRanking');
    Route::get('product-ranking', 'Stats/productRanking');
    Route::get('supplier-ranking', 'Stats/supplierRanking');
});

// 客户余额 API
Route::group('balance', function () {
    Route::get('records', 'Balance/records');
    Route::post('adjust', 'Balance/adjust');
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
