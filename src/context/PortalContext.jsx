import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { portalMeApi } from '../api/portalApi'

const PortalContext = createContext(null)

export function PortalProvider({ children }) {
  const [customer, setCustomer]       = useState(null)
  const [initializing, setInitializing] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const res = await portalMeApi()
      setCustomer(res.data.data)
    } catch {
      setCustomer(null)
    } finally {
      setInitializing(false)
    }
  }, [])

  useEffect(() => { loadMe() }, [loadMe])

  const logout = useCallback(() => {
    setCustomer(null)
  }, [])

  return (
    <PortalContext.Provider value={{ customer, setCustomer, initializing, logout, reload: loadMe }}>
      {children}
    </PortalContext.Provider>
  )
}

export const usePortal = () => useContext(PortalContext)
