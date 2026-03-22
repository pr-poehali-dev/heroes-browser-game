import { useState } from "react";
import AdminPanel from "@/components/AdminPanel";

export default function GameFooter() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleSecretClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      setClickCount(0);
      setShowAdmin(true);
    }
  };

  return (
    <>
      <footer
        className="game-footer py-[61px]"
        style={{ textAlign: "center", padding: "12px 16px" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "4px 16px",
            marginBottom: 4,
          }}
        >
          <a className="footer-link">Правила</a>
          <a className="footer-link">Помощь</a>
          <a className="footer-link">Контакты</a>
        </div>
        <div
          onClick={handleSecretClick}
          style={{ fontSize: 11, color: "var(--text-medium)", cursor: "default", userSelect: "none" }}
        >
          ⚜ Герои — 2025 ⚜
        </div>
      </footer>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}