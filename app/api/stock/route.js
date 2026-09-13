import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// อนุญาตให้เว็บ Landing Page (คนละโดเมน) เรียก endpoint นี้ได้
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// รองรับ preflight request ของ CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  // ดึงเฉพาะฟิลด์ที่จำเป็นสำหรับแสดงสต๊อกหน้า Landing Page
  const { data, error } = await supabase
    .from('products')
    .select('sku, name, stock, unit')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  // แปลงสต๊อกเป็นสถานะให้ฝั่ง Landing Page เอาไปแสดงผลได้ทันที
  // เกณฑ์: 0 = หมด, 1-5 = ใกล้หมด, มากกว่า 5 = มีสินค้า
  const items = (data || []).map((p) => {
    let status = 'in_stock';
    if (p.stock <= 0) {
      status = 'out_of_stock';
    } else if (p.stock <= 5) {
      status = 'low_stock';
    }

    return {
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      unit: p.unit,
      status, // 'in_stock' | 'low_stock' | 'out_of_stock'
    };
  });

  return NextResponse.json(
    {
      success: true,
      updated_at: new Date().toISOString(),
      items,
    },
    { headers: CORS_HEADERS }
  );
}
