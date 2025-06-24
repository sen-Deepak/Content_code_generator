'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'
import Image from 'next/image';
import logo2 from '../../../../logo2.png';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function UserDashboardPage() {
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [contentType, setContentType] = useState('')
  const [carouselCount, setCarouselCount] = useState(2)
  const [codeCount, setCodeCount] = useState(1)
  type UserProfile = {
    id: string;
    email: string;
    team_code: string;
    role: string;
  };
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [codes, setCodes] = useState<{ code: string; id?: string }[]>([])
  const [copiedCodes, setCopiedCodes] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{campaign?: boolean, contentType?: boolean, codeCount?: boolean}>({});
  const router = useRouter();

  const fetchCampaigns = async () => {
    const { data, error } = await supabase.from('campaigns').select('name')
    if (data) setCampaigns(data.map((c: { name: string }) => c.name))
    else if (error) alert('Error fetching campaigns')
  }

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userData) setUserProfile(userData)
    else if (userError) alert('Error fetching user profile')
  }

  const generateAndStoreCodes = async () => {
    const errors: {campaign?: boolean, contentType?: boolean, codeCount?: boolean} = {};
    if (!selectedCampaign) errors.campaign = true;
    if (!contentType) errors.contentType = true;
    if (!codeCount) errors.codeCount = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!userProfile || !userProfile.id || !userProfile.team_code || !userProfile.email) {
      alert('User profile not loaded or missing required fields');
      return;
    }

    const teamCode = userProfile.team_code;
    const userId = userProfile.id;
    const email = userProfile.email;
    const campaign = selectedCampaign.replace(/\s/g, '');
    const typeInitial = contentType.charAt(0).toUpperCase();
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    const { data: existingCodes } = await supabase
      .from('generated_codes')
      .select('sequence')
      .eq('user_id', userId)
      .eq('campaign', campaign)
      .order('sequence', { ascending: false })
      .limit(1);
    let startSeq = 1;
    if (existingCodes && existingCodes.length > 0) {
      startSeq = (existingCodes[0].sequence || 0) + 1;
    }

    const newCodes = [];
    for (let i = 0; i < codeCount; i++) {
      const sequence = startSeq + i;
      const code = `[${teamCode}${campaign}${sequence}${typeInitial}${contentType === 'Carousel' ? carouselCount : ''}]`;
      newCodes.push({
        user_id: userId,
        team_code: teamCode,
        email,
        campaign,
        sequence,
        type: contentType,
        carousel_count: contentType === 'Carousel' ? carouselCount : null,
        code,
        date,
        time,
      });
    }

    const { error } = await supabase.from('generated_codes').insert(newCodes);
    if (error) {
      console.error('Supabase insert error:', error);
      alert('Error storing codes: ' + error.message);
    } else {
      setCodes(newCodes);
    }
  }

  useEffect(() => {
    // Check authentication and role
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      // Optionally, fetch user role from DB and check for user
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (!userData || userData.role !== 'user') {
        router.replace('/login');
      }
    };
    checkAuth();
    fetchCampaigns();
    fetchUserProfile();
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3eafc] to-[#f5f7fa] font-[Inter,Segoe UI,sans-serif]">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-lg space-y-7 transition-all duration-300">
        {/* Top Row: Logo left, user info right */}
        <div className="flex items-center mb-6">
          <Image
            src={logo2}
            alt="Logo"
            width={62}
            height={62}
            className="mr-6 transition-transform duration-300 hover:scale-105"
          />
          {userProfile && (
            <div className="flex flex-col justify-center items-end flex-1 h-[56px]">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm mb-1 shadow-sm">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5.121 17.804A13.937 13.937 0 0112 15c2.21 0 4.304.534 6.121 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {userProfile.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : ''}: {userProfile.team_code}
              </span>
              <span className="text-gray-500 text-base mt-1">
                {userProfile.email}
              </span>
            </div>
          )}
        </div>
        {/* Campaign Dropdown */}
        <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Campaign</label>
          <select className={`w-full p-3 border rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 ${fieldErrors.campaign ? 'border-red-500' : 'border-gray-300'}`} value={selectedCampaign} onChange={e => { setSelectedCampaign(e.target.value); setFieldErrors(f => ({...f, campaign: false})); }}>
            <option value="" disabled hidden className="text-gray-400">Campaign</option>
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {fieldErrors.campaign && <div className="text-red-500 text-xs mt-1">Please select a campaign.</div>}
        </div>
        {/* Content Type and Code Count Row */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1">
            <label className="block text-base font-semibold text-gray-700 mb-2">Content Type</label>
            <select className={`w-full p-3 border rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 ${fieldErrors.contentType ? 'border-red-500' : 'border-gray-300'}`} value={contentType} onChange={e => { setContentType(e.target.value); setFieldErrors(f => ({...f, contentType: false})); }}>
              <option value="" disabled hidden className="text-gray-400">Content Type</option>
              <option value="Static">Static</option>
              <option value="Reel">Reel</option>
              <option value="Carousel">Carousel</option>
            </select>
            {fieldErrors.contentType && <div className="text-red-500 text-xs mt-1">Please select a content type.</div>}
          </div>
          <div className="flex-1">
            <label className="block text-base font-semibold text-gray-700 mb-2">Code Count</label>
            <select className={`w-full p-3 border rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 ${fieldErrors.codeCount ? 'border-red-500' : 'border-gray-300'}`} value={codeCount} onChange={e => { setCodeCount(parseInt(e.target.value)); setFieldErrors(f => ({...f, codeCount: false})); }}>
              <option value="" disabled hidden className="text-gray-400">Code Count</option>
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            {fieldErrors.codeCount && <div className="text-red-500 text-xs mt-1">Please select code count.</div>}
          </div>
        </div>
        {/* Carousel Count if Carousel */}
        {contentType === 'Carousel' && (
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Slide Count</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800" value={carouselCount} onChange={e => setCarouselCount(parseInt(e.target.value))}>
              <option value="" disabled hidden className="text-gray-400">Slide Count</option>
              {[...Array(19)].map((_, i) => (
                <option key={i + 2} value={i + 2}>{i + 2}</option>
              ))}
            </select>
          </div>
        )}
        {/* Generate Button */}
        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-lg shadow-md transition-all duration-200 hover:bg-indigo-700 focus:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200" onClick={generateAndStoreCodes}>
          Generate Code(s)
        </button>
        {/* Generated Codes List */}
        <div>
          <h2 className="text-lg font-bold mt-6 text-gray-800 mb-3 flex items-center gap-2"><span className="inline-block w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m2 0a2 2 0 100-4 2 2 0 000 4zm-8 0a2 2 0 100-4 2 2 0 000 4zm2 8a8 8 0 100-16 8 8 0 000 16z" /></svg></span>Your Generated Codes</h2>
          <div className="mt-2 grid grid-cols-2 gap-4">
            {codes.length > 0 ? codes.map(c => (
              <div
                key={c.id || c.code}
                onClick={async () => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(c.code);
                  } else {
                    // Fallback: use a hidden textarea for copy
                    const textarea = document.createElement('textarea');
                    textarea.value = c.code;
                    textarea.setAttribute('readonly', '');
                    textarea.style.position = 'absolute';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                      document.execCommand('copy');
                    } catch {
                      window.prompt('Copy this code:', c.code);
                    }
                    document.body.removeChild(textarea);
                  }
                  setCopiedCodes(prev => prev.includes(c.code) ? prev : [...prev, c.code]);
                }}
                className={`border p-4 rounded-xl cursor-pointer text-center font-mono text-base shadow-sm transition-all duration-200 select-none overflow-hidden break-all ${copiedCodes.includes(c.code) ? 'text-red-600 border-red-400 bg-red-50' : 'hover:bg-indigo-50 hover:shadow-lg'}`}
                title={c.code}
              >
                {c.code}
              </div>
            )) : (
              <div className="col-span-2 text-gray-400 text-center"></div>
            )}
          </div>
        </div>
        {/* Logout Button */}
        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-5 py-2 rounded-lg font-semibold shadow transition-all duration-200"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
