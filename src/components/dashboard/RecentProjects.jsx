import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';

const RecentProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user]);

  const openProject = (id) => {
    navigate('/ide', { state: { workspaceId: id } });
  };

  if (loading) {
     return (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl flex items-center justify-center h-48">
           <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
     );
  }

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        Recent Projects
        <span className="text-xs font-normal bg-white/10 px-2 py-1 rounded-md text-gray-300">{projects.length} Total</span>
      </h2>
      
      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
           <p>No projects found. Create one to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-white/10 text-sm">
                <th className="pb-4 font-medium uppercase tracking-wider">Project Name</th>
                <th className="pb-4 font-medium uppercase tracking-wider">Last Edited</th>
                <th className="pb-4 font-medium uppercase tracking-wider">Status</th>
                <th className="pb-4 font-medium uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                  <td className="py-4 text-white font-medium pl-2">{project.name || 'Untitled Workspace'}</td>
                  <td className="py-4 text-gray-400 text-sm">{new Date(project.updated_at).toLocaleDateString()}</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2">
                     <button 
                       onClick={() => openProject(project.id)}
                       className="opacity-0 group-hover:opacity-100 flex items-center justify-end w-full gap-2 text-primary hover:text-white transition-all text-sm font-medium"
                     >
                       Open IDE <ArrowRight className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentProjects;
