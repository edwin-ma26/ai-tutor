import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Learning from "@/pages/Learning";
import Practice from "@/pages/Practice";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";

function Router() {
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/learning/:courseId" component={Learning} />
      <Route path="/practice" component={Practice} />
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
