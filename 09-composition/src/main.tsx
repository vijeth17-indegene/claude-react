import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { CombinedProvider} from './context/CombineContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <CombinedProvider>
        <App />
      </CombinedProvider>
    </ThemeProvider>
    
  </StrictMode>,
)
