import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/index'
import { initializeAuth } from './store/slices/authSlice'
import './index.css'
import App from './App.jsx'

// Restore session from existing httpOnly cookie before rendering.
// The app will stay in a loading state (initializing: true) until this settles.
store.dispatch(initializeAuth())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
