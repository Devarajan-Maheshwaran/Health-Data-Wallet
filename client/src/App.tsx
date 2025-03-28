import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import UploadData from "@/pages/UploadData";
import ManageAccess from "@/pages/ManageAccess";
import ViewRecords from "@/pages/ViewRecords";
import DoctorDashboard from "@/pages/DoctorDashboard";
import PatientDetailView from "@/pages/PatientDetailView";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/upload" component={UploadData} />
      <Route path="/access" component={ManageAccess} />
      <Route path="/records" component={ViewRecords} />
      <Route path="/doctor" component={DoctorDashboard} />
      <Route path="/patient/:id" component={PatientDetailView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
