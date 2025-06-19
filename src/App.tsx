
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import SpotifyCallback from '@/pages/SpotifyCallback';
import NotFound from '@/pages/NotFound';
import { useDeskThing } from '@/contexts/DeskThingContext';

function App() {
  const { isRunningOnDeskThing } = useDeskThing();

  // For DeskThing, only show the main Index page
  if (isRunningOnDeskThing) {
    return (
      <ErrorBoundary>
        <Index />
        <Toaster />
      </ErrorBoundary>
    );
  }

  // For web, show full routing
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
