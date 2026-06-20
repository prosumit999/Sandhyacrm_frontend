import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AppRoutes from './routes/index'
import { ChatProvider } from './context/ChatContext'
import { PortalProvider } from './context/PortalContext'

export default function App() {
  return (
    <BrowserRouter>
      <PortalProvider>
        <ChatProvider>
          <AppRoutes />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable={false}
            transition={Slide}
            theme="light"
          />
        </ChatProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}
