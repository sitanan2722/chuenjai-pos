import { NextResponse } from 'next/server';

// ดึงค่าจาก Environment Variables ฝั่ง Server (ไม่มี NEXT_PUBLIC_ = ไม่หลุดไปเบราว์เซอร์)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ยิงข้อความ 1 ข้อความไปยัง Telegram
async function sendTelegramMessage(messageText) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: messageText,
      parse_mode: 'HTML',
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }
  return data;
}

// กัน HTML injection จากชื่อสินค้า (เช่น ชื่อมี < หรือ &)
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(request) {
  // ถ้ายังไม่ได้ตั้ง env ไม่ต้องพังทั้งระบบ แค่บอกว่าข้ามการแจ้งเตือน
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return NextResponse.json(
      { success: false, skipped: true, error: 'Telegram config not set' },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { productName, quantity, totalPrice, remainingStock, unit } = body;

    const safeName = escapeHtml(productName);
    const safeUnit = escapeHtml(unit || 'ชิ้น');

    // เวลาปัจจุบันแบบไทย
    const now = new Date().toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    });

    const results = { orderAlert: false, lowStockAlert: false };

    // ── งานที่ 1: แจ้งเตือน Order เข้า ──────────────────────
    const orderMessage =
      `🛍️ <b>มีรายการขายใหม่!</b>\n\n` +
      `• สินค้า: ${safeName}\n` +
      `• จำนวน: ${quantity} ${safeUnit}\n` +
      `• ราคารวม: ${Number(totalPrice).toFixed(2)} บาท\n` +
      `• สต๊อกคงเหลือปัจจุบัน: ${remainingStock} ${safeUnit}\n` +
      `• เวลา: ${now}`;

    await sendTelegramMessage(orderMessage);
    results.orderAlert = true;

    // ── งานที่ 2: แจ้งเตือน Stock เหลือน้อย (<= 5) ──────────
    const LOW_STOCK_THRESHOLD = 5;
    if (remainingStock <= LOW_STOCK_THRESHOLD) {
      const lowStockMessage =
        `🚨 <b>[เตือนภัย] สต๊อกสินค้าใกล้หมด!</b>\n\n` +
        `• สินค้า: ${safeName}\n` +
        `• คงเหลือเพียง: ${remainingStock} ${safeUnit}\n\n` +
        `⚠️ กรุณาเติมสต๊อกสินค้าด่วน!`;

      await sendTelegramMessage(lowStockMessage);
      results.lowStockAlert = true;
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    // ส่งไม่สำเร็จก็ตอบ 200 กลับไป เพื่อไม่ให้ฝั่งขายมองว่าเป็น error ร้ายแรง
    console.error('Telegram notify error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 }
    );
  }
}
