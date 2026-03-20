# ThinkPHP 6 电商管理系统

## 项目结构

```
app/
├── controller/          # 控制器
│   ├── Product.php     # 商品控制器
│   ├── Customer.php    # 客户控制器
│   ├── Supplier.php    # 供应商控制器
│   ├── SalesOrder.php  # 销售单控制器
│   └── PurchaseOrder.php # 进货单控制器
├── model/              # 模型
│   ├── Product.php
│   ├── Category.php
│   ├── Customer.php
│   ├── Supplier.php
│   ├── SalesOrder.php
│   ├── SalesOrderItem.php
│   ├── PurchaseOrder.php
│   └── PurchaseOrderItem.php
route/
└── app.php             # 路由配置
```

## 安装步骤

### 1. 配置数据库
修改 `.env` 文件（已配置好）：
```
[DATABASE]
DATABASE = ecommerce_system
USERNAME = root
PASSWORD = root
```

### 2. 创建数据库
使用之前的 `database.sql` 文件创建数据库表

### 3. 安装测试数据
访问 `install.php` 或手动导入测试数据

## API接口文档

### 商品模块
- `GET /product/list` - 获取商品列表
- `POST /product/add` - 添加商品
- `PUT /product/update/:id` - 更新商品
- `DELETE /product/delete/:id` - 删除商品
- `GET /product/categories` - 获取分类列表
- `POST /product/category/add` - 添加分类

### 客户管理
- `GET /customer/list` - 获取客户列表
- `POST /customer/add` - 添加客户
- `PUT /customer/update/:id` - 更新客户
- `DELETE /customer/delete/:id` - 删除客户

### 供应商管理
- `GET /supplier/list` - 获取供应商列表
- `POST /supplier/add` - 添加供应商
- `PUT /supplier/update/:id` - 更新供应商
- `DELETE /supplier/delete/:id` - 删除供应商

### 销售单
- `GET /sales/list` - 获取销售单列表
- `POST /sales/create` - 创建销售单
- `GET /sales/detail/:id` - 获取销售单详情

### 进货单
- `GET /purchase/list` - 获取进货单列表
- `POST /purchase/create` - 创建进货单
- `GET /purchase/detail/:id` - 获取进货单详情

## 使用示例

### 创建销售单
```javascript
fetch('/sales/create', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        customer_id: 1,
        items: [
            {product_id: 1, quantity: 2, unit_price: 100},
            {product_id: 2, quantity: 1, unit_price: 200}
        ],
        discount: 50,
        shipping_fee: 20,
        actual_amount: 370,
        description: '订单说明'
    })
})
```

## TP6 优势

1. **ORM模型** - 使用 ThinkPHP 的模型关联，代码更简洁
2. **自动验证** - 可以添加验证器进行数据验证
3. **事务处理** - 自动事务管理，数据更安全
4. **路由管理** - RESTful 风格的路由
5. **中间件** - 可以添加权限验证、日志记录等
6. **缓存支持** - 内置缓存机制，性能更好

## 下一步

1. 修改前端 JavaScript，将 API 请求改为 TP6 的路由
2. 添加验证器（validate）进行数据验证
3. 添加中间件进行权限控制
4. 使用 TP6 的视图模板替换现有前端
