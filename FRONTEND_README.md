# 前后端分离架构说明

## 项目结构

```
public/                      # 前端文件（纯静态）
├── index.html              # 首页
├── product.html            # 商品管理页面
├── customer.html           # 客户管理页面
├── supplier.html           # 供应商管理页面
├── sales.html              # 销售单页面
├── purchase.html           # 进货单页面
└── static/
    ├── css/
    │   └── style.css       # 样式文件
    └── js/
        ├── product.js      # 商品模块JS
        ├── customer.js     # 客户模块JS
        ├── supplier.js     # 供应商模块JS
        └── sales.js        # 销售单模块JS

app/                         # 后端代码（ThinkPHP 6）
├── controller/             # 控制器（纯API）
│   ├── Product.php
│   ├── Customer.php
│   ├── Supplier.php
│   ├── SalesOrder.php
│   └── PurchaseOrder.php
└── model/                  # 模型
    ├── Product.php
    ├── Customer.php
    └── ...
```

## 前后端分离特点

### 后端（ThinkPHP 6）
- **只提供 API 接口**，不渲染视图
- 所有接口返回 JSON 格式数据
- RESTful 风格的路由设计
- 使用 ORM 模型操作数据库

### 前端（纯静态 HTML）
- **独立的 HTML 文件**，不依赖后端模板引擎
- 使用原生 JavaScript 调用 API
- 通过 Fetch API 与后端通信
- 完全的前后端解耦

## API 接口列表

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

## 使用方法

### 1. 启动后端服务
```bash
php think run
```

### 2. 访问前端页面
直接访问 HTML 文件：
- http://localhost:8000/index.html
- http://localhost:8000/product.html
- http://localhost:8000/customer.html
- http://localhost:8000/supplier.html
- http://localhost:8000/sales.html
- http://localhost:8000/purchase.html

### 3. 前端调用 API 示例
```javascript
// 获取商品列表
fetch('/product/list')
    .then(response => response.json())
    .then(result => {
        if (result.code === 200) {
            console.log(result.data);
        }
    });

// 添加商品
fetch('/product/add', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        name: '商品名称',
        price: 99.99,
        stock: 100
    })
})
.then(response => response.json())
.then(result => {
    console.log(result);
});
```

## 优势

1. **前后端完全分离** - 前端和后端可以独立开发和部署
2. **API 可复用** - 同一套 API 可以给网页、APP、小程序使用
3. **易于维护** - 前端和后端代码互不干扰
4. **性能更好** - 前端静态文件可以使用 CDN 加速
5. **开发效率高** - 前后端可以并行开发

## 部署建议

### 开发环境
- 前端：直接访问 HTML 文件
- 后端：`php think run`

### 生产环境
- 前端：部署到 Nginx/Apache 静态目录
- 后端：配置 Nginx 反向代理到 ThinkPHP
- 跨域：配置 CORS 允许前端域名访问

## 下一步优化

1. 使用 Vue.js 或 React 替换原生 JavaScript
2. 添加用户认证和权限管理
3. 使用 Token 进行身份验证
4. 添加数据缓存机制
5. 使用 Webpack 打包前端资源
