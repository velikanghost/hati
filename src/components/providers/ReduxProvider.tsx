'use client'

import React from 'react'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'
import { store } from '@/store'

interface ReduxProviderProps {
  children: React.ReactNode
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      {children}
      <Toaster />
    </Provider>
  )
}

export default ReduxProvider
