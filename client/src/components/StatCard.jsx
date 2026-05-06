import React from 'react';

function StatCard({ label, value, highlight = false, valueClassName = '' }) {
  return (
    <article className={`stat-card ${highlight ? 'highlight' : ''}`.trim()}>
      <span>{label}</span>
      <strong className={valueClassName}>{value}</strong>
    </article>
  );
}

export default StatCard;
