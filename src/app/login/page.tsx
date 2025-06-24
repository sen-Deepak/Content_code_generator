'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (loginError) {
        alert(loginError.message);
        setLoading(false)
        return;
      }

      if (!loginData?.user) {
        alert('No user data returned');
        setLoading(false)
        return;
      }

      // Fetch role from users table
      const { data: userData, error: userTableError } = await supabase
        .from('users')
        .select('role')
        .eq('id', loginData.user.id)
        .single();

      if (userTableError || !userData) {
        alert('Could not fetch user role');
        setLoading(false)
        return;
      }

      // Save role in session storage for easy access
      sessionStorage.setItem('userRole', userData.role);

      // Redirect based on role
      if (userData.role === 'admin') {
        await router.replace('/admin/dashboard');
      } else if (userData.role === 'user') {
        await router.replace('/user/dashboard');
      } else {
        alert('Unknown role');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login');
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
      {/* Logo and App Name above the card */}
      <div className="flex flex-col items-center mb-4 mt-6">
        <Image
          src="https://creativefuel.io/assets/imgs/logo/logo-dark.svg"
          alt="Company Logo"
          width={210}
          height={70}
          className="mx-auto mb-3"
          aria-label="Company Logo"
        />
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 text-center" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
          Content Code Generator
        </h1>
      </div>
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 flex flex-col items-center" style={{ minHeight: 520 }}>
        {/* Email Field */}
        <div className="w-full mb-4">
          <label htmlFor="email" className="block text-gray-700 text-base font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-label="Email address"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-base text-gray-900 transition"
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>
        {/* Password Field */}
        <div className="w-full mb-8">
          <label htmlFor="password" className="block text-gray-700 text-base font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            aria-label="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-base text-gray-900 transition"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>
        {/* Login Button */}
        <button
          onClick={handleLogin}
          aria-label="Login"
          className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-lg shadow transition-all duration-150 hover:bg-indigo-600 focus:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          style={{ boxShadow: '0 2px 8px 0 rgba(99,102,241,0.10)' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  )
}