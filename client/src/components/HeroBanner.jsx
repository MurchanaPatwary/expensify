import React from 'react';

function HeroBanner({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`hero-card ${className}`.trim()}>
      <div className="hero-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{description}</p>
      </div>
      <div className="hero-stats">{children}</div>
    </section>
  );
}

export default HeroBanner;
