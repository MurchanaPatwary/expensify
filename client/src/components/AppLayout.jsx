import React from 'react';

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <main className="app-container">{children}</main>
    </div>
  );
}

export default AppLayout;
