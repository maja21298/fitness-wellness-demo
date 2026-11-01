import { lazy, Suspense } from 'react';
import { BrowserRouter,Routes,Route,Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MusicProvider } from './contexts/MusicContext';
import { ToastProvider } from './components/common/Toast';
import AppLayout from './components/layout/AppLayout';
import ComingSoon from './pages/ComingSoon';
const Dashboard=lazy(()=>import('./pages/Dashboard'));
const WorkoutPlan=lazy(()=>import('./pages/WorkoutPlan'));
const WorkoutDay=lazy(()=>import('./pages/WorkoutDay'));
const NutritionPlan=lazy(()=>import('./pages/NutritionPlan'));
// Original Progress source remains in src/pages/Progress.jsx for continued development.
// The public preview intentionally hides its unfinished visual design.
const SavedRecipes=lazy(()=>import('./pages/SavedRecipes'));
const Soon=({title})=><ComingSoon title={title} />;
export default function App(){return <BrowserRouter><AuthProvider><MusicProvider><ToastProvider>
  <Suspense fallback={<div className="demo-loading">Loading your wellness space…</div>}><Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
    <Route path="/login" element={<Navigate to="/dashboard" replace/>}/>
    <Route path="/onboarding" element={<Navigate to="/dashboard" replace/>}/>
    <Route element={<AppLayout/>}>
      <Route path="dashboard" element={<Dashboard/>}/>
      <Route path="workout" element={<WorkoutPlan/>}/>
      <Route path="workout/day/:dateKey" element={<WorkoutDay/>}/>
      <Route path="workout/:day" element={<WorkoutDay/>}/>
      <Route path="nutrition" element={<NutritionPlan/>}/>
      <Route path="recipes" element={<SavedRecipes/>}/>
      <Route path="progress" element={<Soon title="Progress Dashboard"/>}/>
      <Route path="body" element={<Soon title="Body Analysis"/>}/>
      <Route path="activities" element={<Soon title="Extra Activities"/>}/>
      <Route path="activities/:activityId" element={<Soon title="Extra Activities"/>}/>
      <Route path="nutrition/scan" element={<Soon title="Food Scanner"/>}/>
      <Route path="music" element={<Soon title="Music & Integrations"/>}/>
      <Route path="support" element={<Soon title="Support Centre"/>}/>
      <Route path="settings" element={<Soon title="Personalization & Settings"/>}/>
      <Route path="upgrade" element={<Soon title="Premium Features"/>}/>
      <Route path="admin" element={<Navigate to="/dashboard" replace/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
  </Routes></Suspense>
</ToastProvider></MusicProvider></AuthProvider></BrowserRouter>}
