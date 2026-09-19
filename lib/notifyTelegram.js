// ส่งข้อมูลการขายไปให้ API route ภายใน เพื่อให้ฝั่ง server ยิงเข้า Telegram
// ฟังก์ชันนี้จะไม่ throw ออกมาเด็ดขาด — ล้มเหลวก็แค่ log ไว้
export async function notifyTelegram(payload) {
  try {
    const res = await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) {
      console.warn('Telegram notification not sent:', data.error);
    }
    return data;
  } catch (error) {
    console.warn('Telegram notification failed:', error);
    return { success: false, error: error.message };
  }
}
