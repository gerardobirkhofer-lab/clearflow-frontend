import { ReactNode } from 'react';
import BackButton from './BackButton';
import Breadcrumbs from './Breadcrumbs';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showBreadcrumbs?: boolean;
  backTo?: string;
  backLabel?: string;
}

export default function PageLayout({
  children,
  title,
  showBack = true,
  showBreadcrumbs = true,
  backTo,
  backLabel,
}: PageLayoutProps) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      {showBreadcrumbs && <Breadcrumbs />}
      {showBack && <BackButton to={backTo} label={backLabel} />}
      {title && (
        <h1 style={{ margin: '0 0 24px 0', fontSize: 28, fontWeight: 800 }}>{title}</h1>
      )}
      {children}
    </div>
  );
}
