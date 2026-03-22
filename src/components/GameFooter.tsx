export default function GameFooter() {
  return (
    <footer
      className="game-footer"
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
      <div style={{ fontSize: 11, color: "var(--text-medium)" }}>
        ⚜ Герои — 2025 ⚜
      </div>
    </footer>
  );
}
