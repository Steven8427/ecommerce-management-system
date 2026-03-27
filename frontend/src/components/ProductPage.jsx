import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../api';
import { useToast } from './Toast';

function getCategoryName(product) {
  if (product.category_name) return product.category_name;
  if (product.category && typeof product.category === 'object' && product.category.name) return product.category.name;
  if (product.category && (typeof product.category === 'string' || typeof product.category === 'number')) return String(product.category);
  return '-';
}

function ProductPage() {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState('products');

  // Products state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', cost_price: '', price: '', stock: '', unit: '', category_id: '', description: '', image: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Category state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', parent_id: '' });

  // Image preview state
  const [previewImage, setPreviewImage] = useState(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    apiGet('/product/list')
      .then(res => {
        if (res.code === 200) {
          setProducts(res.data || []);
        } else {
          showToast('error', '\u9519\u8BEF', res.message || '\u83B7\u53D6\u5546\u54C1\u5931\u8D25');
        }
      })
      .catch(() => showToast('error', '\u9519\u8BEF', '\u7F51\u7EDC\u9519\u8BEF'))
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    apiGet('/product/categories')
      .then(res => {
        if (res.code === 200) {
          setCategories(res.data || []);
        }
      })
      .catch(() => {});
  };

  // ── Products ──

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', cost_price: '', price: '', stock: '', unit: '', category_id: '', description: '', image: '' });
    setShowProductModal(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      cost_price: product.cost_price ?? '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      unit: product.unit || '',
      category_id: product.category_id != null ? String(product.category_id)
        : (product.category && typeof product.category === 'object' && product.category.id) ? String(product.category.id)
        : (product.category && typeof product.category === 'number') ? String(product.category)
        : '',
      description: product.description || '',
      image: product.image || ''
    });
    setShowProductModal(true);
  };

  const handleProductFormChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', '\u9519\u8BEF', '\u56FE\u7247\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC75MB');
      e.target.value = '';
      return;
    }
    setUploading(true);
    apiUpload('/upload/image', file)
      .then(res => {
        if (res.code === 200 && res.data && res.data.url) {
          setProductForm(prev => ({ ...prev, image: res.data.url }));
          showToast('success', '\u6210\u529F', '\u56FE\u7247\u4E0A\u4F20\u6210\u529F');
        } else {
          showToast('error', '\u9519\u8BEF', res.message || '\u56FE\u7247\u4E0A\u4F20\u5931\u8D25');
        }
      })
      .catch(() => showToast('error', '\u9519\u8BEF', '\u56FE\u7247\u4E0A\u4F20\u5931\u8D25'))
      .finally(() => setUploading(false));
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...productForm,
      cost_price: Number(productForm.cost_price),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      category: productForm.category_id ? Number(productForm.category_id) : undefined
    };

    const request = editingProduct
      ? apiPut(`/product/update/${editingProduct.id}`, data)
      : apiPost('/product/add', data);

    request
      .then(res => {
        if (res.code === 200) {
          showToast('success', '\u6210\u529F', editingProduct ? '\u5546\u54C1\u66F4\u65B0\u6210\u529F' : '\u5546\u54C1\u6DFB\u52A0\u6210\u529F');
          setShowProductModal(false);
          fetchProducts();
        } else {
          showToast('error', '\u9519\u8BEF', res.message || '\u64CD\u4F5C\u5931\u8D25');
        }
      })
      .catch(() => showToast('error', '\u9519\u8BEF', '\u7F51\u7EDC\u9519\u8BEF'))
      .finally(() => setSaving(false));
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm('\u786E\u5B9A\u8981\u5220\u9664\u8BE5\u5546\u54C1\u5417\uFF1F')) return;
    setDeletingId(id);
    apiDelete(`/product/delete/${id}`)
      .then(res => {
        if (res.code === 200) {
          showToast('success', '\u6210\u529F', '\u5546\u54C1\u5220\u9664\u6210\u529F');
          fetchProducts();
        } else {
          showToast('error', '\u9519\u8BEF', res.message || '\u5220\u9664\u5931\u8D25');
        }
      })
      .catch(() => showToast('error', '\u9519\u8BEF', '\u7F51\u7EDC\u9519\u8BEF'))
      .finally(() => setDeletingId(null));
  };

  // ── Categories ──

  const openAddCategory = () => {
    setCategoryForm({ name: '', parent_id: '' });
    setShowCategoryModal(true);
  };

  const handleCategoryFormChange = (e) => {
    setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    const data = {
      name: categoryForm.name,
      parent_id: categoryForm.parent_id ? Number(categoryForm.parent_id) : 0
    };
    apiPost('/product/category/add', data)
      .then(res => {
        if (res.code === 200) {
          showToast('success', '\u6210\u529F', '\u5206\u7C7B\u6DFB\u52A0\u6210\u529F');
          setShowCategoryModal(false);
          fetchCategories();
        } else {
          showToast('error', '\u9519\u8BEF', res.message || '\u6DFB\u52A0\u5931\u8D25');
        }
      })
      .catch(() => showToast('error', '\u9519\u8BEF', '\u7F51\u7EDC\u9519\u8BEF'));
  };

  const handleDeleteCategory = (id) => {
    if (!window.confirm('\u786E\u5B9A\u8981\u5220\u9664\u8BE5\u5206\u7C7B\u5417\uFF1F')) return;
    setDeletingId(id);
    apiDelete(`/product/category/delete/${id}`)
      .then(res => {
        if (res.code === 200) {
          showToast('success', '\u6210\u529F', '\u5206\u7C7B\u5220\u9664\u6210\u529F');
          fetchCategories();
        } else {
          showToast('error', '\u9519\u8BEF', res.message || '\u5220\u9664\u5931\u8D25');
        }
      })
      .catch(() => showToast('error', '\u9519\u8BEF', '\u7F51\u7EDC\u9519\u8BEF'))
      .finally(() => setDeletingId(null));
  };

  const getParentCategoryName = (parentId) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  };

  // ── Render ──

  return (
    <div>
      <div className="page-header">
        <h2>{'\u{1F4E6}'} 商品管理</h2>
        {activeTab === 'products' ? (
          <button className="btn btn-primary" onClick={openAddProduct}>+ 添加商品</button>
        ) : (
          <button className="btn btn-primary" onClick={openAddCategory}>+ 添加分类</button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          商品管理
        </button>
        <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          商品分类
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>商品名称</th>
                  <th>成本价</th>
                  <th>客户价</th>
                  <th>单位</th>
                  <th>库存</th>
                  <th>分类</th>
                  <th>图片</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">{'\u{1F4E6}'}</div>
                        <div className="empty-state-text">暂无商品数据</div>
                      </div>
                    </td>
                  </tr>
                ) : products.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{'\u00A5'}{Number(product.cost_price).toFixed(2)}</td>
                    <td>{'\u00A5'}{Number(product.price).toFixed(2)}</td>
                    <td>{product.unit || '-'}</td>
                    <td>
                      {product.stock <= 0 ? (
                        <span style={{
                          fontWeight: 600, color: '#fff', background: '#e74c3c',
                          padding: '2px 8px', borderRadius: 4, fontSize: 13,
                        }}>
                          缺货
                        </span>
                      ) : (
                        <span>{product.stock}</span>
                      )}
                    </td>
                    <td>{getCategoryName(product)}</td>
                    <td>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => setPreviewImage(product.image)}
                        />
                      ) : '-'}
                    </td>
                    <td>
                      <button className="btn" style={{ marginRight: 8, padding: '5px 14px', fontSize: 13 }} onClick={() => openEditProduct(product)}>编辑</button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 14px', fontSize: 13 }}
                        disabled={deletingId === product.id}
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        {deletingId === product.id ? '删除中...' : '删除'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>分类名称</th>
              <th>父分类</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">{'\u{1F4E6}'}</div>
                    <div className="empty-state-text">暂无分类数据</div>
                  </div>
                </td>
              </tr>
            ) : categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>{cat.name}</td>
                <td>{getParentCategoryName(cat.parent_id)}</td>
                <td>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 14px', fontSize: 13 }}
                    disabled={deletingId === cat.id}
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    {deletingId === cat.id ? '删除中...' : '删除'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingProduct ? `编辑商品 #${editingProduct.id}` : '添加商品'}</h3>
            <button className="close-btn" onClick={() => setShowProductModal(false)}>&times;</button>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>商品名称 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input name="name" value={productForm.name} onChange={handleProductFormChange} required />
              </div>
              <div className="form-group">
                <label>成本价格 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input name="cost_price" type="number" step="0.01" min="0" value={productForm.cost_price} onChange={handleProductFormChange} placeholder="进货成本价" required />
              </div>
              <div className="form-group">
                <label>客户价格 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input name="price" type="number" step="0.01" min="0" value={productForm.price} onChange={handleProductFormChange} placeholder="销售给客户的价格" required />
              </div>
              <div className="form-group">
                <label>分类</label>
                <select name="category_id" value={productForm.category_id} onChange={handleProductFormChange}>
                  <option value="">选择分类</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>单位</label>
                <input name="unit" value={productForm.unit} onChange={handleProductFormChange} placeholder="如：个、件、箱、米、kg" />
              </div>
              <div className="form-group">
                <label>库存 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input name="stock" type="number" min="0" value={productForm.stock} onChange={handleProductFormChange} required />
              </div>
              <div className="form-group">
                <label>商品图片</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {uploading && <p style={{ color: '#718096', fontSize: 13, marginTop: 6 }}>上传中...</p>}
                {productForm.image && (
                  <div style={{ marginTop: 10 }}>
                    <img src={productForm.image} alt="预览" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                    <br />
                    <button type="button" className="btn btn-danger" style={{ marginTop: 8 }} onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}>删除图片</button>
                  </div>
                )}
                <p style={{ color: '#a0aec0', fontSize: 12, marginTop: 6 }}>支持 JPG、PNG、GIF 格式，最大 5MB</p>
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea name="description" value={productForm.description} onChange={handleProductFormChange} rows={3} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category Add Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>添加分类</h3>
            <button className="close-btn" onClick={() => setShowCategoryModal(false)}>&times;</button>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label>分类名称 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input name="name" value={categoryForm.name} onChange={handleCategoryFormChange} required />
              </div>
              <div className="form-group">
                <label>父分类</label>
                <select name="parent_id" value={categoryForm.parent_id} onChange={handleCategoryFormChange}>
                  <option value="">{'\u65E0\uFF08\u9876\u7EA7\u5206\u7C7B\uFF09'}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>添加分类</button>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="modal-overlay"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            cursor: 'pointer',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ position: 'relative', animation: 'fadeIn 0.25s ease' }}>
            <img
              src={previewImage}
              alt="预览"
              style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: 8, display: 'block', margin: '0 auto', transition: 'transform 0.2s ease' }}
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                color: '#333',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;
