import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { useToast } from './Toast';

function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/supplier/list');
      setSuppliers(res.data || res || []);
    } catch (err) {
      showToast('error', '加载失败', err.message || '无法获取制作厂家列表');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm({ name: '', contact: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingSupplier(null);
    setForm({ name: '', contact: '', phone: '', email: '', address: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editingSupplier) {
        await apiPut(`/supplier/update/${editingSupplier.id}`, form);
        showToast('success', '更新成功', '制作厂家信息已更新');
      } else {
        await apiPost('/supplier/add', form);
        showToast('success', '添加成功', '制作厂家已添加');
      }
      closeModal();
      await fetchSuppliers();
    } catch (err) {
      showToast('error', '操作失败', err.message || '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该制作厂家吗？此操作不可撤销。')) return;
    setDeletingId(id);
    try {
      await apiDelete(`/supplier/delete/${id}`);
      showToast('success', '删除成功', '制作厂家已删除');
      await fetchSuppliers();
    } catch (err) {
      showToast('error', '删除失败', err.message || '请稍后重试');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>🏭 制作厂家管理</h2>
        <button className="btn btn-primary" onClick={openAddModal}>+ 添加制作厂家</button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>供应商名称</th>
              <th>联系人</th>
              <th>电话</th>
              <th>邮箱</th>
              <th>地址</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🏭</div>
                    <div className="empty-state-text">暂无制作厂家数据</div>
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.contact || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td>{s.address || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn"
                        style={{ padding: '5px 14px', fontSize: 13 }}
                        onClick={() => openEditModal(s)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 14px', fontSize: 13 }}
                        disabled={deletingId === s.id}
                        onClick={() => handleDelete(s.id)}
                      >
                        {deletingId === s.id ? '删除中...' : '删除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>&times;</button>
            <h3>{editingSupplier ? `编辑制作厂家 #${editingSupplier.id}` : '添加制作厂家'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>供应商名称 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>联系人</label>
                <input
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>电话</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>地址</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierPage;
