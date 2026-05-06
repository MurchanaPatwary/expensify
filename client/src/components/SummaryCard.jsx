import React from 'react';

function SummaryCard({ icon, label, value, description, valueClassName = '', accent = '' }) {
  const className = ['panel', 'summary-card', accent].filter(Boolean).join(' ');

  return (
    <article className={className}>
      <div className="summary-head">
        <div className="icon-wrap soft">{icon}</div>
        <span>{label}</span>
      </div>
      <strong className={valueClassName}>{value}</strong>
      <p>{description}</p>
    </article>
  );
}

export default SummaryCard;
