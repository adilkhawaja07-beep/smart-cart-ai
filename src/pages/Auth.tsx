import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) throw error;
        toast({ title: "Welcome back!" });
      } else {
        const { error } = await signUp(form.email, form.password, form.fullName);
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account before signing in.",
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <img src={logo} alt="FreshCart" className="h-10 w-10" />
          <span className="font-display text-2xl font-bold text-foreground">FreshCart</span>
        </Link>

        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to your account" : "Join FreshCart today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label>Full Name</Label>
                  <Input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </CardContent>
        </Card>

        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>
      </div>
    </div>
  );
};

export default Auth;
