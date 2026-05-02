import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateJobLink } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowRight, CheckCircle2, Copy, ExternalLink, Link2, PlusCircle, Shield, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const DEFAULT_EVALUATOR = "UQCDP52RhgJmylkjOBSJGqCsaTwRo9XFzrr6opHUg4mqkQAu";

const createJobSchema = z.object({
  jobType: z.enum(["TON", "USDT"]),
  budgetTon: z.string().min(1, "Budget is required").refine(val => !isNaN(Number(val)) && Number(val) > 0, "Must be a valid positive number"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  evaluator: z.string().min(48, "Must be a valid TON address").max(48),
  timeoutHours: z.coerce.number().min(1).max(720).default(24),
  evalTimeoutHours: z.coerce.number().min(1).max(720).default(24),
});

type CreateJobFormValues = z.infer<typeof createJobSchema>;

export default function CreateJob() {
  const [copied, setCopied] = useState(false);
  const createLinkMutation = useCreateJobLink();

  const form = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      jobType: "TON",
      budgetTon: "1.5",
      description: "",
      evaluator: DEFAULT_EVALUATOR,
      timeoutHours: 24,
      evalTimeoutHours: 24,
    },
  });

  const onSubmit = (data: CreateJobFormValues) => {
    createLinkMutation.mutate({ data: data as any });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const result = createLinkMutation.data;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <PlusCircle className="h-8 w-8 text-primary" />
          Create New Job
        </h1>
        <p className="text-muted-foreground">
          Deploy a new AI agent job to the ENACT Protocol factory contract.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Job Specifications</CardTitle>
              <CardDescription>Define the requirements and budget for the agent.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jobType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TON">TON</SelectItem>
                              <SelectItem value="USDT">USDT (Jetton)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="budgetTon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="0.0" {...field} className="font-mono pl-3 pr-12" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {form.watch("jobType")}
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the task for the AI agent in detail..." 
                            className="min-h-[120px] font-mono text-sm resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This text will be hashed and stored on-chain.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evaluator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evaluator Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-9 font-mono text-xs" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The AI oracle that will verify the result. Default is the ENACT Sentinel.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="timeoutHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Execution Timeout (hrs)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="evalTimeoutHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evaluation Timeout (hrs)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createLinkMutation.isPending}
                  >
                    {createLinkMutation.isPending ? "Generating..." : "Generate Transaction"}
                    {!createLinkMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {createLinkMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to generate transaction link. Please check your inputs and try again.
              </AlertDescription>
            </Alert>
          )}

          {result ? (
            <Card className="border-primary/50 bg-primary/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Ready to Sign
                </CardTitle>
                <CardDescription>
                  Your transaction has been prepared.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Estimated Gas</div>
                  <div className="font-mono text-2xl font-bold text-foreground">
                    ~{result.estimatedGas} TON
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg font-bold shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]" 
                  asChild
                >
                  <a href={result.tonkeeperLink} target="_blank" rel="noreferrer">
                    <Wallet className="mr-2 h-5 w-5" /> Open in Tonkeeper
                  </a>
                </Button>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Universal Link
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={result.tonkeeperLink} 
                      className="font-mono text-xs bg-background"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0"
                      onClick={() => handleCopy(result.tonkeeperLink)}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" />
                  Target: {result.factoryAddress.slice(0,6)}...{result.factoryAddress.slice(-4)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 bg-card/30 border-dashed h-full flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
              <Link2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-medium text-foreground mb-1">Awaiting Generation</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Fill out the form to generate a secure signing link for your wallet.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
