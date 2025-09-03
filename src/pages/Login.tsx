import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hard-coded demo credentials
    if (username === 'student' && password === 'vitucircuit') {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/');
    } else {
      setError('Invalid credentials, please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'Times New Roman, serif' }}>
          Circuit Simulator Login
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-md"
              style={{ fontFamily: 'Times New Roman, serif' }}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md"
              style={{ fontFamily: 'Times New Roman, serif' }}
              required
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full rounded-md"
            style={{ fontFamily: 'Times New Roman, serif' }}
          >
            Login
          </Button>
        </form>
        
        <div className="mt-4 text-sm text-center text-muted-foreground">
          <p>Demo credentials:</p>
          <p>Username: student</p>
          <p>Password: vitucircuit</p>
        </div>
      </div>
    </div>
  );
};

export default Login;