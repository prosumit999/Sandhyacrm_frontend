import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/index'
import { ChatProvider } from './context/ChatContext'
import { PortalProvider } from './context/PortalContext'

export default function App() {
  return (
    <BrowserRouter>
      <PortalProvider>
        <ChatProvider>
          <AppRoutes />
        </ChatProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}
