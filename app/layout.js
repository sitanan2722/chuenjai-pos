import './globals.css';

export const metadata = {
  title: 'ชื่นใจ | Mini POS',
  description: 'ระบบขายหน้าร้าน (Mini POS) สำหรับแบรนด์ชาพรีเมียม ชื่นใจ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">
              <span className="brand-icon">🍵</span>
              <span className="brand-name">ชื่นใจ</span>
              <span className="brand-sub">Mini POS</span>
            </div>
            <nav className="main-nav">
              <a href="/" className="nav-link">
                📦 สินค้า
              </a>
              <a href="/sell" className="nav-link">
                🧾 ขายสินค้า
              </a>
              <a href="/history" className="nav-link">
                📊 ประวัติการขาย
              </a>
            </nav>
          </header>

          <main className="app-main">{children}</main>

          <footer className="app-footer">
            <p>ชื่นใจ Mini POS · ระบบจัดการร้านค้าเล็ก</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
