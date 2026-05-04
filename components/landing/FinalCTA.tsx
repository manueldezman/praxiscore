import styles from './FinalCTA.module.css';

export default function FinalCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.headline}>
          Your financial flow, connected, visualized & private.
        </h2>
        <p className={styles.subtext}>
          Start automating your paycheck in seconds.
        </p>
        <button className={styles.ctaButton}>
          Get Started
        </button>
      </div>
    </section>
  );
}
