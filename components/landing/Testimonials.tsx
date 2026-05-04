import styles from './Testimonials.module.css';

const TESTIMONIALS = [
  {
    name: 'Alex Chen',
    initial: 'A',
    color: '#FF6B6B',
    quote: 'Finally, a way to automate my paycheck without revealing my income to the world.',
  },
  {
    name: 'Sarah Miller',
    initial: 'S',
    color: '#6366F1',
    quote: 'The preset rules made it so easy to get started. I was up and running in minutes.',
  },
  {
    name: 'James Wilson',
    initial: 'J',
    color: '#14F195',
    quote: 'Private saving is a game-changer. No more worrying about who can see my balances.',
  },
  {
    name: 'Emily Rodriguez',
    initial: 'E',
    color: '#F59E0B',
    quote: 'Tax automation alone saves me hours every quarter. This is the future of finance.',
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>What users are saying</h2>
        <div className={styles.scrollContainer}>
          <div className={styles.scroll}>
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className={styles.card}>
                <div className={styles.avatar} style={{ backgroundColor: testimonial.color }}>
                  <span className={styles.initial}>{testimonial.initial}</span>
                </div>
                <p className={styles.quote}>"{testimonial.quote}"</p>
                <span className={styles.name}>{testimonial.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
