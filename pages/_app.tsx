import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth/AuthContext';
import { ToastProvider } from '../components/ui/Toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </AuthProvider>
  );
}