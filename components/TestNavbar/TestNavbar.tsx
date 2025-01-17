import React from 'react';
import styles from '../../styles/TestNavbar.module.css';

const TestNavbar: React.FC = () => {
  return (
    <nav className={styles.nav}>
      <div className={styles.navFlex}>
        <img
          src="https://via.placeholder.com/150"
          alt="Logo"
          className={styles.logo}
        />
        <button className={styles.menuButton}>☰</button>
      </div>
    </nav>
  );
};

export default TestNavbar;