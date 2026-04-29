import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { initTelegram } from "@/lib/telegram";
import NotFound from "@/pages/not-found";
import CommandCenter from "@/pages/command-center";
import Home from "@/pages/home";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import CreateJob from "@/pages/create-job";
import EarnPage from "@/pages/earn";
import StatusPage from "@/pages/status";
import ThreatsPage from "@/pages/threats";
import AnalyzePage from "@/pages/analyze";
import ContractsPage from "@/pages/contracts";
import ImmunePage from "@/pages/immune";
import EvolutionPage from "@/pages/evolution";
import AnalyticsPage from "@/pages/analytics";
import NexusPage from "@/pages/nexus";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/"               component={CommandCenter} />
        <Route path="/contracts"      component={ContractsPage} />
        <Route path="/immune"         component={ImmunePage}    />
        <Route path="/evolution"      component={EvolutionPage} />
        <Route path="/analytics"      component={AnalyticsPage} />
        <Route path="/nexus"          component={NexusPage}     />
        <Route path="/status"         component={StatusPage}    />
        <Route path="/threats"        component={ThreatsPage}   />
        <Route path="/analyze"        component={AnalyzePage}   />
        <Route path="/earn"           component={EarnPage}      />
        <Route path="/enact"          component={Home}          />
        <Route path="/jobs"           component={Jobs}          />
        <Route path="/jobs/:address"  component={JobDetail}     />
        <Route path="/create"         component={CreateJob}     />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  useEffect(() => {
    const u = initTelegram();
    // Auto-register on backend so balance/referrals immediately work
    const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: u.id,
        username: u.username || u.name,
        ref_code: u.startParam,
      }),
    }).catch(() => {});
  }, []);

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
