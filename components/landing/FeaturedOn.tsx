import styles from './FeaturedOn.module.css';

const BADGES = [
  { name: 'Colosseum Hackathon', color: '#FF6B6B' },
  { name: 'Solana', color: '#14F195' },
  { name: 'Cloak', color: '#6366F1' },
];

export default function FeaturedOn() {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Featured on</span>
      <div className={styles.badges}>
        {BADGES.map((badge) => (
          <div key={badge.name} className={styles.badge} style={{ borderColor: badge.color }}>
            <span className={styles.badgeDot} style={{ backgroundColor: badge.color }} />
            <span className={styles.badgeName}>{badge.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
