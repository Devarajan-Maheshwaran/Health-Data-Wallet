// Simple toast notification system

// Keep track of toasts
const toasts = [];
let listeners = [];

// Generate unique ID for each toast
function genId() {
  return `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Dispatch toast updates to listeners
function dispatch(action) {
  listeners.forEach(listener => listener(action));
}

// Create a toast
function toast({ title, description, variant = 'default', duration = 5000 }) {
  const id = genId();
  const newToast = { id, title, description, variant, duration };
  
  toasts.push(newToast);
  
  // Dispatch add action
  dispatch({ type: 'ADD_TOAST', toast: newToast });
  
  // Auto dismiss after duration
  setTimeout(() => {
    dispatch({ type: 'REMOVE_TOAST', id });
    
    // Remove from toasts array
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
  }, duration);
  
  return id;
}

// Hook for using toast
function useToast() {
  return {
    toast,
    // Get all current toasts
    getToasts: () => [...toasts],
    // Subscribe to toast updates
    subscribe: (listener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    },
    // Dismiss a toast
    dismiss: (id) => {
      dispatch({ type: 'REMOVE_TOAST', id });
      
      // Remove from toasts array
      const index = toasts.findIndex(t => t.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
      }
    }
  };
}

export { useToast, toast };