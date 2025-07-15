import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInSchema, signUpSchema, type SignInData, type SignUpData } from "@shared/schema";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSignIn = async (data: SignInData) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiRequest('POST', '/api/auth/signin', data);
      
      if (response.ok) {
        // Invalidate auth query to refresh user data
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        setLocation('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Invalid username or password");
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignUpData) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiRequest('POST', '/api/auth/signup', data);
      
      if (response.ok) {
        // Invalidate auth query to refresh user data
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        
        toast({
          title: "Account created!",
          description: "You have successfully created your account and signed in.",
        });
        setLocation('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create account");
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError("An error occurred during sign up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentForm = isSignUp ? signUpForm : signInForm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Create your account to start learning" 
              : "Sign in to continue your learning journey"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={currentForm.handleSubmit(isSignUp ? onSignUp : onSignIn)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                {...currentForm.register("username")}
                placeholder="Enter your username"
              />
              {currentForm.formState.errors.username && (
                <p className="text-sm text-red-500">
                  {currentForm.formState.errors.username.message}
                </p>
              )}
            </div>
            

            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...currentForm.register("password")}
                placeholder="Enter your password"
              />
              {currentForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {currentForm.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                currentForm.reset();
              }}
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}