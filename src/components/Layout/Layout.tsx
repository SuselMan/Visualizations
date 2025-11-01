import { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'ui-kit';
import styles from './Layout.module.css';

export default function Layout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = location.pathname === '/';
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.title}>Visualizations</div>
          <div>
            {!isRoot && (
              <Button type="secondary" onClick={() => navigate(-1)}>Back</Button>
            )}
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}


