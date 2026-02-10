
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogIn, UserPlus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signUpSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authAction, setAuthAction] = useState<"signIn" | "signUp" | "guest" | null>(null);
  const [activeTab, setActiveTab] = useState("sign-in");
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", firstName: "", lastName: "", email: "", password: "" },
  });
  
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const onSignInSubmit = (values: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    setAuthAction("signIn");
    signInWithEmailAndPassword(auth, values.email, values.password)
      .catch((error: any) => {
        let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/invalid-credential') {
          description = "Invalid email or password. Please check your credentials and try again.";
        } else {
          description = error.message;
        }
        toast({
          variant: "destructive",
          title: "Sign-in Failed",
          description: description,
        });
        setIsLoading(false);
        setAuthAction(null);
      });
  };

  const onSignUpSubmit = (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    setAuthAction("signUp");
    const { username, firstName, lastName, email, password } = values;

    const profileData = { username, firstName, lastName };
    localStorage.setItem("pendingUserProfile", JSON.stringify(profileData));
    
    createUserWithEmailAndPassword(auth, email, password)
        .catch((error: any) => {
            console.error("Sign up error:", error);
            localStorage.removeItem("pendingUserProfile");
            toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: error.message || "Could not create account. Please try again.",
            });
            setIsLoading(false);
            setAuthAction(null);
        });
  };
  
  const handleGuestSignIn = () => {
    setIsLoading(true);
    setAuthAction("guest");
    signInAnonymously(auth)
      .catch((error: any) => {
        toast({
          variant: "destructive",
          title: "Guest Sign-in Failed",
          description: error.message || "Could not sign in as guest. Please try again.",
        });
        setIsLoading(false);
        setAuthAction(null);
      });
  };

  if (isUserLoading || (!isUserLoading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Logo />
              <h1 className="text-3xl font-bold font-headline">SkillOrbit</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the learning matrix
            </p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in"><LogIn className="w-4 h-4 mr-2"/>Sign In</TabsTrigger>
              <TabsTrigger value="sign-up"><UserPlus className="w-4 h-4 mr-2"/>Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="voyager@skillorbit.ai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full animate-pulse-glow">
                    {isLoading && authAction === 'signIn' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="sign-up">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={signUpForm.control}
                            name="firstName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={signUpForm.control}
                            name="lastName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={signUpForm.control}
                        name="username"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                            <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="voyager@skillorbit.ai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full animate-pulse-glow">
                    {isLoading && authAction === 'signUp' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                Or
                </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGuestSignIn} disabled={isLoading}>
            {isLoading && authAction === 'guest' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
            Sign in as Guest
          </Button>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {heroImage && (
            <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            width="1920"
            height="1080"
            className="h-full w-full object-cover"
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-10 left-10 text-white">
            <h2 className="text-3xl font-bold">Evolve Your Intellect</h2>
            <p className="mt-2 text-lg max-w-lg">Forge new neural pathways with interactive quizzes, expert tutoring, and specialized cognitive tools.</p>
        </div>
      </div>
    </div>
  );
}
