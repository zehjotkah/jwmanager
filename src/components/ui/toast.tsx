import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  action?: React.ReactNode
}

const ToastContext = createContext<{
  showToast: (props: ToastProps) => void
}>({
  showToast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([])
  const [idCounter, setIdCounter] = useState(0)

  const showToast = (props: ToastProps) => {
    const id = idCounter
    setIdCounter((prev) => prev + 1)
    setToasts((prev) => [...prev, { ...props, id }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 m-4 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn('rounded-md border p-4 shadow-md', {
              'bg-white text-black': toast.variant === 'default' || !toast.variant,
              'bg-green-50 text-green-900 border-green-200': toast.variant === 'success',
              'bg-red-50 text-red-900 border-red-200': toast.variant === 'error',
            })}
          >
            {toast.title && <div className="mb-1 font-medium">{toast.title}</div>}
            {toast.description && <div className="text-sm">{toast.description}</div>}
            {toast.action && <div className="mt-2">{toast.action}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

// Einfaches API für einfachere Verwendung
export const toast = {
  show: (props: ToastProps) => {
    // Da wir keinen tatsächlichen globalen Kontext haben, simulieren wir eine Toast-Nachricht
    const toastContainer = document.createElement('div')
    toastContainer.className = cn(
      'fixed bottom-0 right-0 z-50 m-4 rounded-md border p-4 shadow-md',
      {
        'bg-white text-black': props.variant === 'default' || !props.variant,
        'bg-green-50 text-green-900 border-green-200': props.variant === 'success',
        'bg-red-50 text-red-900 border-red-200': props.variant === 'error',
      },
    )

    if (props.title) {
      const title = document.createElement('div')
      title.className = 'mb-1 font-medium'
      title.textContent = props.title
      toastContainer.appendChild(title)
    }

    if (props.description) {
      const description = document.createElement('div')
      description.className = 'text-sm'
      description.textContent = props.description
      toastContainer.appendChild(description)
    }

    document.body.appendChild(toastContainer)

    setTimeout(() => {
      toastContainer.style.opacity = '0'
      toastContainer.style.transition = 'opacity 0.3s ease-out'
      setTimeout(() => {
        document.body.removeChild(toastContainer)
      }, 300)
    }, 5000)
  },
}
