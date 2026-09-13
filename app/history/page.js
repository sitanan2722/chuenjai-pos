'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  // รายการประวัติการขายทั้งหมด
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // โหลดข้อมูลตอนเปิดหน้า
  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    setLoading(true);
    setErrorMsg('');

    // เรียงจากล่าสุดไปเก่าสุด
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      setErrorMsg('โหลดประวัติการขายไม่สำเร็จ: ' + error.message);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  }

  // ยอดขายรวมทั้งหมด = sum ของ total_price
  const totalRevenue = sales.reduce(
    (sum, s) => sum + (Number(s.total_price) || 0),
    0
  );

  // ฟอร์แมตวันเวลาให้อ่านง่ายแบบไทย
  function formatDateTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <h1 className="page-title">📊 ประวัติการขาย — ชื่นใจ</h1>

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

      {/* สรุปยอดขายรวม */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#e8f0e6',
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: '#6b6b62' }}>ยอดขายรวมทั้งหมด</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2f4a3c' }}>
            {totalRevenue.toFixed(2)} บาท
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#6b6b62', textAlign: 'right' }}>
          จำนวนรายการขาย
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2f4a3c' }}>
            {sales.length} รายการ
          </div>
        </div>
      </div>

      {/* ตารางประวัติการขาย */}
      <div className="card">
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 14, color: '#2f4a3c' }}>
          รายการขายทั้งหมด
        </h2>

        {loading ? (
          <p style={{ color: '#6b6b62' }}>กำลังโหลดข้อมูล...</p>
        ) : sales.length === 0 ? (
          <p style={{ color: '#6b6b62' }}>ยังไม่มีประวัติการขาย</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>วันเวลาที่ขาย</th>
                  <th>ชื่อสินค้า</th>
                  <th>จำนวน</th>
                  <th>ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDateTime(s.sold_at)}</td>
                    <td>{s.product_name}</td>
                    <td>{s.quantity}</td>
                    <td>{Number(s.total_price).toFixed(2)} บาท</td>
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
