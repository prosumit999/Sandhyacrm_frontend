import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import { getConversationsApi } from '../api/chatApi'

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { isAuthenticated } = useSelector(s => s.auth)

  const socketRef        = useRef(null)
  const activeConvIdRef  = useRef(null) // set by Communications to avoid incrementing unread for open conv

  const [conversations,  setConversations]  = useState([])
  const [onlineUsers,    setOnlineUsers]    = useState(new Set())
  const [typingMap,      setTypingMap]      = useState({}) // convId -> Set<userId>
  const [chatUnread,     setChatUnread]     = useState(0)
  const [initialized,    setInitialized]    = useState(false)

  const recalcUnread = useCallback((convs) => {
    setChatUnread(convs.reduce((s, c) => s + (c.unreadCount || 0), 0))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setConversations([])
      setChatUnread(0)
      setInitialized(false)
      return
    }

    // Load conversations
    getConversationsApi().then(r => {
      const convs = r.data.data || []
      setConversations(convs)
      recalcUnread(convs)
      setInitialized(true)
    }).catch(() => setInitialized(true))

    // Connect socket
    const socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('online_users', ids => setOnlineUsers(new Set(ids)))

    socket.on('new_message', ({ conversationId, message }) => {
      setConversations(prev => {
        const isActive = activeConvIdRef.current === conversationId
        const exists   = prev.some(c => c._id === conversationId)

        let updated
        if (exists) {
          updated = prev.map(c => {
            if (c._id !== conversationId) return c
            return {
              ...c,
              lastMessage:  message,
              updatedAt:    message.createdAt,
              unreadCount:  isActive ? 0 : (c.unreadCount || 0) + 1,
            }
          })
        } else {
          updated = prev
        }

        const sorted = [...updated].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        recalcUnread(sorted)
        return sorted
      })
    })

    socket.on('user_typing', ({ userId, conversationId }) => {
      setTypingMap(prev => {
        const s = new Set(prev[conversationId] || [])
        s.add(userId)
        return { ...prev, [conversationId]: s }
      })
    })

    socket.on('user_stopped_typing', ({ userId, conversationId }) => {
      setTypingMap(prev => {
        const s = new Set(prev[conversationId] || [])
        s.delete(userId)
        return { ...prev, [conversationId]: s }
      })
    })

    socket.on('messages_read', ({ conversationId }) => {
      // Trigger a re-render so tick colors update
      setConversations(prev => [...prev])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, recalcUnread])

  const markConvRead = useCallback((convId) => {
    activeConvIdRef.current = convId
    setConversations(prev => {
      const updated = prev.map(c => c._id === convId ? { ...c, unreadCount: 0 } : c)
      recalcUnread(updated)
      return updated
    })
  }, [recalcUnread])

  const clearActiveConv = useCallback(() => {
    activeConvIdRef.current = null
  }, [])

  return (
    <ChatContext.Provider value={{
      socket:         socketRef,        // ref — always current
      conversations,  setConversations,
      onlineUsers,
      typingMap,
      chatUnread,
      initialized,
      markConvRead,
      clearActiveConv,
      activeConvIdRef,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => useContext(ChatContext)
