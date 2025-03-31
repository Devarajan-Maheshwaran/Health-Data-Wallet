import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import UploadData from "./pages/UploadData";
import ManageAccess from "./pages/ManageAccess";
import ViewRecords from "./pages/ViewRecords";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDetailView from "./pages/PatientDetailView";
import PrivacyCenter from "./pages/PrivacyCenter";
import NotFound from "./pages/not-found";
import { Web3Provider } from "./context/Web3Context";
import { useToast } from "./hooks/use-toast";
import { cn } from "./lib/utils";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/upload" component={UploadData} />
      <Route path="/access" component={ManageAccess} />
      <Route path="/records" component={ViewRecords} />
      <Route path="/doctor" component={DoctorDashboard} />
      <Route path="/patient/:id" component={PatientDetailView} />
      <Route path="/privacy" component={PrivacyCenter} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Simple toast container component
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const { subscribe } = useToast();
  
  useEffect(() => {
    // Subscribe to toast updates
    const unsubscribe = subscribe(action => {
      if (action.type === 'ADD_TOAST') {
        setToasts(prev => [...prev, action.toast]);
      } else if (action.type === 'REMOVE_TOAST') {
        setToasts(prev => prev.filter(toast => toast.id !== action.id));
      }
    });
    
    return () => unsubscribe();
  }, [subscribe]);
  
  return (
    <div className="fixed top-0 right-0 p-4 w-full md:max-w-sm z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={cn(
            "bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out",
            toast.variant === 'destructive' ? 'border-red-500' : 'border-gray-200'
          )}
        >
          {toast.title && <h3 className="font-medium">{toast.title}</h3>}
          {toast.description && <p className="text-sm text-gray-600">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <Layout>
          <Router />
        </Layout>
        <ToastContainer />
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;