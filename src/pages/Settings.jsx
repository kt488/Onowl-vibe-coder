import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { User, Mail, Camera, Save, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
        data: { name: name, avatar_url: avatarUrl }
      });

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded! Click save to apply.');
    } catch (error) {
      toast.error('Error uploading image. Make sure you have an "avatars" storage bucket created.');
      // Fallback for demo: just create a dummy URL if bucket fails
      setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white py-12 px-4 relative overflow-hidden flex flex-col items-center">
      {/* Glowing background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Profile Settings
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-black/20 rounded-2xl border border-white/5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 bg-surface flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 shadow-lg transition-transform hover:scale-110">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold text-white">Profile Picture</h3>
                <p className="text-sm text-gray-400">Upload a new avatar. Max size 2MB.</p>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary/50 outline-none transition shadow-inner"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary/50 outline-none transition shadow-inner"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4">
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
              <button 
                type="button"
                onClick={() => navigate('/subscription')}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Manage Subscription
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;

