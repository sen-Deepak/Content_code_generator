'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  team_code: string;
  role: string;
}

interface Campaign {
  id: string;
  name: string;
  created_by: string;
}

export default function AdminDashboardPage() {
  // Use the shared supabase client
  const [section, setSection] = useState<'users' | 'campaigns' | ''>('');
  const [action, setAction] = useState<'add' | 'remove' | ''>('');

  // USER state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [teamCode, setTeamCode] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // CAMPAIGN state
  const [campaignName, setCampaignName] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Add mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (section === 'users') fetchUsers();
    if (section === 'campaigns') fetchCampaigns();
    fetchAdminEmail();
  }, [section]);

  const fetchAdminEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setAdminEmail(user.email || '');
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    setUsers(data || []);
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase.from('campaigns').select('*');
    setCampaigns(data || []);
  };

  const handleAddUser = async () => {
    setLoading(true);

    // Step 1: Call API to create the user in Supabase Auth
    const res = await fetch('/api/create-auth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role,
        team_code: teamCode
      }),
    });

    const result = await res.json();

    if (result.error) {
      setMessage(`Auth error: ${result.error}`);
      console.error('Error creating user:', result.error);
      setLoading(false);
      return;
    }

    setMessage('User added successfully!');
    fetchUsers();
    setEmail('');
    setPassword('');
    setTeamCode('');
    setLoading(false);
  };

  const handleRemoveUser = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage(`User removed`);
      fetchUsers();
    }
  };

  const handleAddCampaign = async () => {
    setLoading(true);
    setMessage('');

    const trimmedCampaignName = campaignName.trim();

    if (!trimmedCampaignName) {
      setMessage('Campaign name cannot be blank.');
      setLoading(false);
      return;
    }

    const isDuplicate = campaigns.some(
      (campaign) => campaign.name.toLowerCase() === trimmedCampaignName.toLowerCase()
    );

    if (isDuplicate) {
      setMessage('Campaign name already exists.');
      setLoading(false);
      return;
    }

    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const { error } = await supabase.from('campaigns').insert([
      {
        id: uuidv4(),
        name: trimmedCampaignName,
        created_by: userId
      }
    ]);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Campaign added successfully!');
      fetchCampaigns();
      setCampaignName('');
    }
    setLoading(false);
  };

  const handleRemoveCampaign = async (id: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Campaign removed');
      fetchCampaigns();
    }
  };

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3eafc] to-[#f5f7fa] font-[Inter,Segoe UI,sans-serif]">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-lg transition-all duration-300 flex flex-col" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          {/* Sticky Top Row: Logo left, admin badge/email right */}
          <div className="flex items-center mb-6 bg-white pb-4" style={{marginLeft: '-2.5rem', marginRight: '-2.5rem', paddingLeft: '2.5rem', paddingRight: '2.5rem'}}>
            <Image
              src="https://www.creativefuel.io/assets/imgs/logo/icon-dark.png"
              alt="Logo"
              width={72}
              height={72}
              className="mr-6 transition-transform duration-300 hover:scale-105"
            />
            <div className="flex flex-col justify-center items-end flex-1 h-[72px]">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm mb-1 shadow-sm">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5.121 17.804A13.937 13.937 0 0112 15c2.21 0 4.304.534 6.121 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </span>
              <span className="text-gray-500 text-base mt-1">{adminEmail}</span>
            </div>
          </div>
          {/* Section Selector */}
          <div>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 mb-4"
              onChange={(e) => {
                setSection(e.target.value as 'users' | 'campaigns' | '');
                setAction('');
                setMessage('');
              }}
              value={section}
            >
              <option value="" disabled hidden className="text-gray-400">Section</option>
              <option value="users">User</option>
              <option value="campaigns">Campaign</option>
            </select>
          </div>
          {/* Action Selector */}
          {section && (
            <div>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 mb-4"
                onChange={(e) => {
                  setAction(e.target.value as 'add' | 'remove' | '');
                  setMessage('');
                }}
                value={action}
              >
                <option value="" disabled hidden className="text-gray-400">Action</option>
                <option value="add">Add {section}</option>
                <option value="remove">Remove {section}</option>
              </select>
            </div>
          )}
          {/* Add User Form */}
          {section === 'users' && action === 'add' && (
            <div className="space-y-4">
              <input
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                placeholder="Team Code"
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="bg-indigo-600 text-white px-4 py-3 rounded-xl w-full font-semibold text-lg shadow-md transition-all duration-200 hover:bg-indigo-700 focus:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                onClick={handleAddUser}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          )}
          {/* Remove User List */}
          {section === 'users' && action === 'remove' && (
            <div className="space-y-2">
              {users.map((u: User) => (
                <div key={u.id} className="flex justify-between items-center border p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{u.email}</p>
                    <p className="text-xs text-gray-500">Code: {u.team_code}</p>
                    <p className="text-xs text-gray-500">Role: {u.role}</p>
                  </div>
                  <button className="text-red-600 hover:underline font-semibold" onClick={() => handleRemoveUser(u.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          {/* Add Campaign Form */}
          {section === 'campaigns' && action === 'add' && (
            <div className="space-y-4">
              <input
                placeholder="Campaign Name"
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <button
                className="bg-indigo-600 text-white px-4 py-3 rounded-xl w-full font-semibold text-lg shadow-md transition-all duration-200 hover:bg-indigo-700 focus:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                onClick={handleAddCampaign}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Campaign'}
              </button>
            </div>
          )}
          {/* Remove Campaign List */}
          {section === 'campaigns' && action === 'remove' && (
            <div className="space-y-2">
              {campaigns.map((c: Campaign) => (
                <div key={c.id} className="flex justify-between items-center border p-3 rounded-lg">
                  <div className="font-semibold text-gray-800">{c.name}</div>
                  <button className="text-red-600 hover:underline font-semibold" onClick={() => handleRemoveCampaign(c.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          {/* Message */}
          {message && <div className="mt-4 text-center text-indigo-600 font-semibold">{message}</div>}
          <div className="flex justify-end mt-auto pt-6">
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
    </div>
  );
}
