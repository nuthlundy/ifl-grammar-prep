import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { PracticePage } from './pages/PracticePage';
import { GrammarMap } from './pages/GrammarMap';
import { ProgressPage } from './pages/ProgressPage';
import { SkillDetailPage } from './pages/SkillDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useProgress } from './hooks/useProgress';
import { allQuestions, taxonomy, blueprint } from './hooks/useData';

function App() {
  const {
    progress,
    addAttempt,
    beginSession,
    endSession,
    finishDiagnostic,
    resetProgress,
  } = useProgress();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard progress={progress} />} />
            <Route
              path="/diagnostic"
              element={
                <DiagnosticPage
                  progress={progress}
                  allQuestions={allQuestions}
                  onAttempt={addAttempt}
                  onBeginSession={beginSession}
                  onEndSession={endSession}
                  onFinishDiagnostic={finishDiagnostic}
                />
              }
            />
            <Route
              path="/practice"
              element={
                <PracticePage
                  progress={progress}
                  allQuestions={allQuestions}
                  onAttempt={addAttempt}
                  onBeginSession={beginSession}
                  onEndSession={endSession}
                />
              }
            />
            <Route
              path="/grammar-map"
              element={
                <GrammarMap
                  progress={progress}
                  taxonomy={taxonomy}
                  blueprint={blueprint}
                />
              }
            />
            <Route
              path="/skills/:skillId"
              element={
                <SkillDetailPage
                  progress={progress}
                  taxonomy={taxonomy}
                  blueprint={blueprint}
                  allQuestions={allQuestions}
                />
              }
            />
            <Route
              path="/progress"
              element={
                <ProgressPage
                  progress={progress}
                  onReset={resetProgress}
                />
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
