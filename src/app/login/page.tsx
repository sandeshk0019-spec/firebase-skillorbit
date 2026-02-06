"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

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
  const [activeTab, setActiveTab] = useState("sign-in");

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
    signInWithEmailAndPassword(auth, values.email, values.password)
      .catch((error: any) => {
        let description = "An unexpected error occurred. Please try again.";
        // "auth/invalid-credential" covers wrong password and user not found cases.
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
      });
  };

  const onSignUpSubmit = (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
       <div className="flex items-center gap-2 mb-6">
          <Logo />
          <span className="text-2xl font-semibold font-headline">SkillOrbit</span>
        </div>
      <Card className="w-full max-w-md bg-card/50">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Access the Matrix</CardTitle>
          <CardDescription>
            Sign in or create an account to begin your journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
