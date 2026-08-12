"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthPageContent({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  useEffect(() => {
    if (searchParams.get("tab") === "register") {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: identifier,
        password,
      });

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        toast.success("Welcome back!");
        router.refresh();
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Logging you in...");

      // Auto-login after registration
      const result = await signIn("credentials", {
        redirect: false,
        username: regPhone,
        password: regPassword,
      });

      if (result?.error) {
        toast.error("Account created, but automatic login failed. Please sign in.");
        setIsLogin(true);
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Side: Visual / Brand */}
      <div className="hidden md:flex w-full md:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: `url('https://ik.imagekit.io/5s3m6qubf/gallery/synod_house_bg_GllY8W-MF.jpg')` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-cyan-950/80 via-slate-900/80 to-slate-950/90" />
        
        <div className="relative z-20 flex flex-col items-center text-center p-12 max-w-lg">
          <div className="bg-white/10 p-6 rounded-full backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
            <img 
              src={logoUrl || "/logo.svg"}
              alt="Lamka Coaching Center Logo" 
              width={80} 
              height={80} 
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 animate-gradient-text">True Potential</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            Join the most trusted coaching center. Master your subjects, access premium study cabins, and achieve your goals with expert guidance.
          </p>
          
          <div className="flex gap-4 mt-8">
             <div className="h-1.5 w-12 rounded-full bg-cyan-500" />
             <div className="h-1.5 w-3 rounded-full bg-slate-600" />
             <div className="h-1.5 w-3 rounded-full bg-slate-600" />
          </div>
        </div>
      </div>

      {/* Right Side: Form Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 relative">
        {/* Mobile Logo */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <img src={logoUrl || "/logo.svg"} alt="Lamka Coaching Center" width={60} height={60} className="mb-4" />
          <h1 className="text-2xl font-bold">Lamka Coaching Center</h1>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {isLogin ? "Welcome Back" : "Create an Account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Enter your credentials to access your dashboard" 
                : "Join us and start your learning journey today"}
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-cyan-900/5">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin} 
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Phone Number, Email, or Username</Label>
                    <Input
                      id="identifier"
                      placeholder="e.g. 9876543210"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="bg-background/50 h-12 focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 h-12 focus-visible:ring-cyan-500"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-500/25 transition-all mt-4 cta-shimmer"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center">
                        Sign In <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRegister} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="regName">Full Name</Label>
                    <Input
                      id="regName"
                      placeholder="John Doe"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="bg-background/50 h-11 focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPhone">Phone Number</Label>
                    <Input
                      id="regPhone"
                      placeholder="10-digit mobile number"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="bg-background/50 h-11 focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Email Address</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="bg-background/50 h-11 focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password</Label>
                    <Input
                      id="regPassword"
                      type="password"
                      placeholder="Create a strong password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="bg-background/50 h-11 focus-visible:ring-cyan-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-500/25 transition-all mt-6 cta-shimmer"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center">
                        Create Account <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle between modes */}
          <div className="text-center mt-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              type="button"
              className="text-sm text-muted-foreground hover:text-cyan-600 transition-colors font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up here" 
                : "Already have an account? Sign in"}
            </button>
          </div>
          
          <div className="text-center mt-8">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
