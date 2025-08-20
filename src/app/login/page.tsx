'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const { login, isLoading, error, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your AI Product Explorer account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="test@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="password123"
              />
            </div>
            
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Demo Account</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use these credentials to test the application:
            </p>
            <div className="text-sm font-mono">
              <div>Email: test@example.com</div>
              <div>Password: password123</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              ← Back to Products
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}