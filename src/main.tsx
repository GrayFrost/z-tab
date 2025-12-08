import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { IconStyleProvider } from './contexts/IconStyleContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IconStyleProvider>
      <App />
    </IconStyleProvider>
  </React.StrictMode>
)
