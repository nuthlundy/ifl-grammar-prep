import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button, PageWrapper } from '../components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <div className="text-center py-20">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 mb-6">This page does not exist.</p>
        <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    </PageWrapper>
  );
}
