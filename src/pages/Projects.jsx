import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, FolderKanban, Clock, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Projects = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, updated_at, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const openProject = (id) => {
    navigate('/ide', { state: { workspaceId: id } });
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (!error) {
      toast.success('Project deleted');
      fetchProjects(); // Refresh list
    } else {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col z-10">
        <TopBar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
              All AI Projects
            </h1>
            <p className="text-gray-400">Manage and resume all your generated workspaces.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-12 rounded-3xl text-center flex flex-col items-center">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                 <FolderKanban className="w-10 h-10 text-gray-500" />
               </div>
               <h3 className="text-xl font-bold mb-2">No projects yet</h3>
               <p className="text-gray-400 max-w-md mb-8">You haven't generated any workspaces yet. Head back to the dashboard and create your first AI app.</p>
               <button onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all">
                 Go to Dashboard
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => openProject(project.id)}
                  className="bg-white/5 border border-white/10 hover:border-primary/50 backdrop-blur-md p-6 rounded-3xl transition-all cursor-pointer group hover:bg-white/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/20 rounded-xl text-primary">
                      <FolderKanban size={24} />
                    </div>
                    <button 
                      onClick={(e) => deleteProject(project.id, e)} 
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 truncate">{project.name || 'Untitled Workspace'}</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={14} /> Edited {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                     <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md">Saved in Cloud</span>
                     <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1 text-sm font-bold">
                       Open <ArrowRight size={16} />
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Projects;