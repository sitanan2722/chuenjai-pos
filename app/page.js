'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductsPage() {
  // รายการสินค้าทั้งหมด
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // ค่าฟอร์มเพิ่ม/แก้ไขสินค้า
  const emptyForm = { sku: '', name: '', price: '', stock: '', unit: '' };
  const [form, setForm] = useState(emptyForm);

  // ถ้ามีค่านี้ แปลว่ากำลังแก้ไขสินค้า id นี้อยู่ (ไม่ใช่การเพิ่มใหม่)
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // ดึงข้อมูลสินค้าตอนโหลดหน้าครั้งแรก
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg('โหลดรายการสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  // อัปเดตค่าฟอร์มเมื่อพิมพ์
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // เพิ่มสินค้าใหม่ หรือบันทึกการแก้ไข
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!form.sku || !form.name || !form.price || !form.stock || !form.unit) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setSaving(true);

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      unit: form.unit.trim(),
    };

    let error;
    if (editingId) {
      // โหมดแก้ไข: อัปเดตสินค้าที่มี id ตรงกับ editingId
      ({ error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingId));
    } else {
      // โหมดเพิ่มใหม่
      ({ error } = await supabase.from('products').insert([payload]));
    }

    if (error) {
      setErrorMsg('บันทึกไม่สำเร็จ: ' + error.message);
    } else {
      setForm(emptyForm);
      setEditingId(null);
      await fetchProducts();
    }
    setSaving(false);
  }

  // กดปุ่มแก้ไข: เอาข้อมูลแถวนั้นมาใส่ในฟอร์ม
  function handleEditClick(product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku || '',
      name: product.name || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      unit: product.unit || '',
    });
    setErrorMsg('');
  }

  // ยกเลิกโหมดแก้ไข กลับไปโหมดเพิ่มใหม่
  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setErrorMsg('');
  }

  // ลบสินค้า
  async function handleDelete(id) {
    const confirmDelete = window.confirm('ยืนยันลบสินค้ารายการนี้หรือไม่?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setErrorMsg('ลบไม่สำเร็จ: ' + error.message);
    } else {
      // ถ้ากำลังแก้ไขสินค้าตัวที่เพิ่งลบอยู่ ให้เคลียร์ฟอร์มด้วย
      if (editingId === id) handleCancelEdit();
      await fetchProducts();
    }
  }

  return (
    <div>
      <h1 className="page-title">📦 รายการสินค้า — ชื่นใจ</h1>

      {errorMsg && (
        <div
          className="card"
          style={{
            background: '#fbe4e1',
            color: '#c05c4d',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* ฟอร์มเพิ่ม / แก้ไขสินค้า */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 14, color: '#2f4a3c' }}>
          {editingId ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>SKU</label>
              <input
                className="input"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="เช่น CJ-YUZU-250"
              />
            </div>
            <div>
              <label style={labelStyle}>ชื่อสินค้า</label>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="เช่น ชาส้มยูซุ 250ml"
              />
            </div>
            <div>
              <label style={labelStyle}>ราคา (บาท)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="55"
              />
            </div>
            <div>
              <label style={labelStyle}>คงเหลือ</label>
              <input
                className="input"
                type="number"
                min="0"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="20"
              />
            </div>
            <div>
              <label style={labelStyle}>หน่วย</label>
              <input
                className="input"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="ขวด"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ตารางแสดงรายการสินค้า */}
      <div className="card">
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 14, color: '#2f4a3c' }}>
          รายการสินค้าทั้งหมด
        </h2>

        {loading ? (
          <p style={{ color: '#6b6b62' }}>กำลังโหลดข้อมูล...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#6b6b62' }}>ยังไม่มีสินค้าในระบบ</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>ชื่อสินค้า</th>
                  <th>ราคา</th>
                  <th>คงเหลือ</th>
                  <th>หน่วย</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{Number(p.price).toFixed(2)} บาท</td>
                    <td>
                      <span className={`badge ${p.stock <= 5 ? 'badge-low' : 'badge-ok'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td>{p.unit}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: 13 }}
                          onClick={() => handleEditClick(p)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: 13 }}
                          onClick={() => handleDelete(p.id)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// สไตล์เล็กๆ สำหรับ label ในฟอร์ม
const labelStyle = {
  display: 'block',
  fontSize: 13,
  color: '#6b6b62',
  marginBottom: 4,
  fontWeight: 600,
};
