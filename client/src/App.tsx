import { ThemeProvider } from './contexts';
import { DashboardLayout } from './layouts';
import { Dashboard } from './pages';

function App() {
  return (
    <ThemeProvider>
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    </ThemeProvider>
  );
}

export default App;
