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
import { Loader2, ArrowRight, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isNativePlatform } from "@/lib/capacitor/bridge";
import {
  getBiometricStatus,
  getBiometricCredentials,
  saveBiometricCredentials,
  type BiometricStatus,
} from "@/lib/capacitor/biometrics";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function AuthPageContent({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);

  // Proactive Biometric Prompt State
  const [showBioPrompt, setShowBioPrompt] = useState(false);
  const [pendingBioCreds, setPendingBioCreds] = useState<{ identifier: string; password: string; role?: string } | null>(null);

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);
    if (searchParams.get("tab") === "register") {
      setIsLogin(false);
    }
    if (native) {
      setTimeout(() => {
        getBiometricStatus().then((status) => {
          setBiometricStatus(status);
        });
      }, 1000);
    }
  }, [searchParams]);

  const proceedToApp = () => {
    router.refresh();
    const callbackUrl = searchParams.get("callbackUrl");
    if (callbackUrl && callbackUrl.startsWith("/")) {
      router.push(callbackUrl);
    } else {
      router.push("/dashboard");
    }
  };

  const handleEnableBiometrics = async () => {
    if (pendingBioCreds) {
      await saveBiometricCredentials(pendingBioCreds.identifier, pendingBioCreds.password, pendingBioCreds.role || "student");
      toast.success("Fingerprint 1-tap sign-in enabled!");
    }
    setShowBioPrompt(false);
    proceedToApp();
  };

  const handleSkipBiometrics = () => {
    setShowBioPrompt(false);
    toast.success("Welcome back!");
    proceedToApp();
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const creds = await getBiometricCredentials();
      if (!creds) {
        setBiometricLoading(false);
        return;
      }
      setLoading(true);
      const result = await signIn("credentials", {
        redirect: false,
        username: creds.identifier,
        password: creds.password,
      });

      if (result?.error) {
        toast.error("Biometric authentication expired. Please enter password.");
      } else {
        toast.success("Signed in with Biometrics!");
        router.refresh();
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl && callbackUrl.startsWith("/")) {
          router.push(callbackUrl);
        } else if (creds.role === "admin" || creds.role === "staff") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      toast.error("Biometric sign-in failed.");
    } finally {
      setLoading(false);
      setBiometricLoading(false);
    }
  };

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
        // Proactively ask to enable biometrics if available and not yet configured
        if (isNative && biometricStatus?.isAvailable && !biometricStatus?.hasStoredCredentials) {
          setPendingBioCreds({ identifier, password, role: "student" });
          setShowBioPrompt(true);
        } else {
          toast.success("Welcome back!");
          proceedToApp();
        }
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
        if (isNative && biometricStatus?.isAvailable && !biometricStatus?.hasStoredCredentials) {
          setPendingBioCreds({ identifier: regPhone, password: regPassword, role: "student" });
          setShowBioPrompt(true);
        } else {
          proceedToApp();
        }
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
          <div className={`bg-white/10 p-6 rounded-full border border-white/20 mb-8 shadow-2xl ${isNative ? '' : 'backdrop-blur-md'}`}>
            <img 
              src={logoUrl || "/logo.png"}
              alt="Lamka Coaching Center Logo" 
              width={80} 
              height={80} 
              className="drop-shadow-lg object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('?fallback=true')) {
                  target.src = '/logo.png?fallback=true';
                }
              }}
            />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Unlock Your <span className={`text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 ${isNative ? '' : 'animate-gradient-text'}`}>True Potential</span>
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
          <img 
            src={logoUrl || "/logo.png"} 
            alt="Lamka Coaching Center" 
            width={72} 
            height={72} 
            className="mb-4 object-contain drop-shadow-md" 
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('?fallback=true')) {
                target.src = '/logo.png?fallback=true';
              }
            }}
          />
          <h1 className="text-2xl font-bold text-slate-900">Lamka Coaching Center</h1>
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

          <div className={`border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-cyan-900/5 ${isNative ? 'bg-card/95' : 'bg-card/50 backdrop-blur-xl'}`}>
            {/* Quick 1-Tap Biometric Fingerprint Button on Native Android */}
            {isLogin && isNative && biometricStatus?.hasStoredCredentials && (
              <div className="mb-6 pb-6 border-b border-border/50">
                <Button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={loading || biometricLoading}
                  variant="outline"
                  className="w-full h-14 border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-semibold gap-3 rounded-2xl shadow-xs transition-all flex items-center justify-center text-sm"
                >
                  {biometricLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                  ) : (
                    <Fingerprint className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  )}
                  <span>Sign In with Fingerprint</span>
                </Button>
                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t border-border/60"></div>
                  <span className="flex-shrink mx-3 text-xs text-muted-foreground uppercase font-medium">Or with password</span>
                  <div className="flex-grow border-t border-border/60"></div>
                </div>
              </div>
            )}

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
                    className={`w-full h-12 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-500/25 transition-all mt-4 ${isNative ? '' : 'cta-shimmer'}`}
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
                    className={`w-full h-12 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-500/25 transition-all mt-6 ${isNative ? '' : 'cta-shimmer'}`}
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
          
          {!isNative && (
            <div className="text-center mt-8">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
                &larr; Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Proactive 1-Tap Biometric Prompt Modal */}
      <Dialog open={showBioPrompt} onOpenChange={(open) => { if (!open) handleSkipBiometrics(); }}>
        <DialogContent className={`sm:max-w-sm rounded-3xl p-6 text-center border border-border/80 shadow-2xl ${isNative ? 'bg-background' : 'bg-background/95 backdrop-blur-xl'}`}>
          <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-inner">
            <Fingerprint className="h-9 w-9" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-center text-xl font-bold text-foreground">
              Enable Fingerprint Sign-In?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed px-2">
              Use your fingerprint sensor for instant, secure 1-tap sign-in next time you open the Lamka Coaching app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              onClick={handleEnableBiometrics}
              className="w-full h-12 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all text-sm"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Enable Fingerprint
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkipBiometrics}
              className="w-full h-10 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
