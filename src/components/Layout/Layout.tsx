import { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'ui-kit';
import styles from './Layout.module.css';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.title}>Visualizations</div>
          <div>
            <Link to="/">
              <Button type="secondary">Домой</Button>
            </Link>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}


