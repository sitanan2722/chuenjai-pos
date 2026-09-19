'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { notifyTelegram } from '../../lib/notifyTelegram'; // 🆕 เพิ่ม import

export default function SellPage() {
  // รายการสินค้าทั้งหมด (ใช้เติม dropdown)
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ฟอร์มขายสินค้า
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const [selling, setSelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // โหลดรายการสินค้าตอนเปิดหน้า
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setErrorMsg('โหลดรายการสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoadingProducts(false);
  }

  // หาสินค้าที่ถูกเลือกอยู่จาก id
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  // คำนวณยอดรวม = ราคา x จำนวน
  const qtyNumber = parseInt(quantity, 10);
  const totalPrice =
    selectedProduct && !isNaN(qtyNumber) && qtyNumber > 0
      ? selectedProduct.price * qtyNumber
      : 0;

  function resetForm() {
    setSelectedProductId('');
    setQuantity('');
  }

  async function handleSell(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!selectedProduct) {
      setErrorMsg('กรุณาเลือกสินค้า');
      return;
    }
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      setErrorMsg('กรุณากรอกจำนวนให้ถูกต้อง');
      return;
    }
    // ตรวจสอบ stock เพียงพอหรือไม่
    if (qtyNumber > selectedProduct.stock) {
      setErrorMsg(
        `สต๊อกไม่พอ! คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit} เท่านั้น`
      );
      return;
    }

    setSelling(true);

    const total = selectedProduct.price * qtyNumber;

    // 1) บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qtyNumber,
        total_price: total,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      setErrorMsg('บันทึกการขายไม่สำเร็จ: ' + saleError.message);
      setSelling(false);
      return;
    }

    // 2) อัปเดต stock ในตาราง products ให้ลดลงตามจำนวนที่ขาย
    const newStock = selectedProduct.stock - qtyNumber;
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (stockError) {
      setErrorMsg(
        'บันทึกการขายสำเร็จ แต่ปรับสต๊อกไม่สำเร็จ: ' + stockError.message
      );
      setSelling(false);
      await fetchProducts();
      return;
    }

    // 3) 🆕 แจ้งเตือนเข้า Telegram (ตัดสต๊อกสำเร็จแล้วเท่านั้นถึงจะยิง)
    //    ห่อ try-catch ไว้อีกชั้น + ฟังก์ชันข้างในก็ไม่ throw อยู่แล้ว
    //    ดังนั้นต่อให้ Telegram ล่ม ระบบขายก็ยังทำงานครบทุกขั้นตอน
    try {
      await notifyTelegram({
        productName: selectedProduct.name,
        quantity: qtyNumber,
        totalPrice: total,
        remainingStock: newStock,
        unit: selectedProduct.unit,
      });
    } catch (notifyError) {
      console.warn('ส่งแจ้งเตือน Telegram ไม่สำเร็จ (ไม่กระทบการขาย):', notifyError);
    }

    // 4) สำเร็จทั้งหมด: แจ้งเตือนในเว็บและรีเซ็ตฟอร์ม
    setSuccessMsg(
      `ขาย "${selectedProduct.name}" จำนวน ${qtyNumber} ${selectedProduct.unit} สำเร็จ (รวม ${total.toFixed(
        2
      )} บาท)`
    );
    resetForm();
    await fetchProducts();
    setSelling(false);
  }

  return (
    <div>
      <h1 className="page-title">🧾 ขายสินค้า — ชื่นใจ</h1>

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

      {successMsg && (
        <div
          className="card"
          style={{
            background: '#e8f0e6',
            color: '#2f4a3c',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      <div className="card" style={{ maxWidth: 480 }}>
        {loadingProducts ? (
          <p style={{ color: '#6b6b62' }}>กำลังโหลดรายการสินค้า...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#6b6b62' }}>
            ยังไม่มีสินค้าในระบบ กรุณาเพิ่มสินค้าที่หน้ารายการสินค้าก่อน
          </p>
        ) : (
          <form onSubmit={handleSell}>
            {/* Dropdown เลือกสินค้า */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>เลือกสินค้า</label>
              <select
                className="input"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- กรุณาเลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {Number(p.price).toFixed(2)} บาท (คงเหลือ {p.stock}{' '}
                    {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* จำนวนที่ขาย */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>จำนวนที่ขาย</label>
              <input
                className="input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="เช่น 2"
              />
            </div>

            {/* แสดงยอดรวมอัตโนมัติ */}
            <div
              className="card"
              style={{
                background: '#faf6ee',
                marginBottom: 18,
                padding: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 14, color: '#6b6b62' }}>ยอดรวม</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#2f4a3c' }}>
                {totalPrice.toFixed(2)} บาท
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={selling}>
              {selling ? 'กำลังบันทึกการขาย...' : '✅ ขาย'}
            </button>
          </form>
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
