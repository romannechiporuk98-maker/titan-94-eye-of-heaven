import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import CreateJob from "@/pages/create-job";
import EarnPage from "@/pages/earn";
import StatusPage from "@/pages/status";
import ThreatsPage from "@/pages/threats";
import AnalyzePage from "@/pages/analyze";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/"               component={Home}       />
        <Route path="/jobs"           component={Jobs}       />
        <Route path="/jobs/:address"  component={JobDetail}  />
        <Route path="/create"         component={CreateJob}  />
        <Route path="/earn"           component={EarnPage}   />
        <Route path="/status"         component={StatusPage} />
        <Route path="/threats"        component={ThreatsPage}/>
        <Route path="/analyze"        component={AnalyzePage}/>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
