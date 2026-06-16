import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginApi, logoutApi, getMeApi } from '../../api/authApi'

// Called on app startup to restore session from the existing httpOnly cookie.
// The backend's /auth/me returns the user if the logintoken cookie is still valid.
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMeApi()
      return res.data.data  // { _id, name, email, role, ... }
    } catch {
      return rejectWithValue(null)  // no active session — not an error
    }
  }
)

// POST /api/v1/auth/login
// Backend sets httpOnly cookies (logintoken + refreshToken) on success.
// Response body: { success, message, user: { id, name, email, role } }
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await loginApi({ email, password })
      return res.data.user   // { id, name, email, role }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Invalid credentials'
      )
    }
  }
)

// POST /api/v1/auth/logout
// Backend clears both cookies.
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi()
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    initializing: true,   // true until initializeAuth settles on first load
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── initializeAuth ──────────────────────────────────────────────────────
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.initializing = false
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.initializing = false
      })

    // ── loginUser ───────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // ── logoutUser ──────────────────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
