
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
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
      <>
        <Index />
        <Toaster />
      </>
    );
  }

  // For web, show full routing
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
