import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Aquí se agregarán más reducers según se necesiten
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
