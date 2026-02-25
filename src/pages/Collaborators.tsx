import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { Plus, Users, Edit2, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Collaborators = () => {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    specialty: '', 
    commission_rate: 50,
    email: '',
    password: '' 
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    const { data, error } = await supabase.from('users').select('*').order('name');
    
    if (error) {
      console.error('Error fetching users:', error);
      addNotification('Erro', 'Não foi possível carregar a equipe.', 'error');
    }
    if (data) setCollaborators(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = { ...formData };
    if (!payload.password && editingId) {
      delete payload.password;
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('users').update(payload).eq('id', editingId).select();
        
        if (error) throw error;
        
        addNotification('Atualizado', `${formData.name} atualizada com sucesso.`, 'success');
        closeModal();
      } else {
        const { error } = await supabase.from('users').insert([payload]).select();
        
        if (error) throw error;
        
        addNotification('Colaboradora Cadastrada', `${formData.name} foi adicionada à equipe.`, 'success');
        closeModal();
      }
      fetchCollaborators();
    } catch (err: any) {
      console.error('Final Save Error:', err);
      addNotification('Erro ao salvar', `Detalhe: ${err.message || 'Erro desconhecido'}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', deleteId);
      if (error) throw error;
      
      addNotification('Excluído', 'Colaboradora removida com sucesso.', 'info');
      setShowConfirm(false);
      setDeleteId(null);
      fetchCollaborators();
    } catch (err: any) {
      addNotification('Erro', 'Não foi possível excluir. Verifique se há vínculos.', 'error');
      console.error(err);
    }
  };

  const openModal = (collab?: any) => {
    if (collab) {
      setEditingId(collab.id);
      setFormData({ 
        name: collab.name, 
        specialty: collab.specialty, 
        commission_rate: collab.commission_rate || 50,
        email: collab.email || '',
        password: '' // Don't prepopulate password for security
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', specialty: '', commission_rate: 50, email: '', password: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', specialty: '', commission_rate: 50, email: '', password: '' });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>Equipe</h2>
          <p style={{ color: '#64748b' }}>Gerencie suas colaboradoras e suas comissões.</p>
        </div>
        <button className="btn btn-primary w-full md:w-auto" onClick={() => openModal()}>
          <Plus size={18} /> Cadastrar Colaboradora
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborators.map(c => (
          <div key={c.id} className="card p-6 flex flex-col items-center text-center hover:translate-y-[-4px] transition-transform">
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'var(--gray-50)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1rem',
              border: '2px solid var(--primary)',
              boxShadow: '0 0 15px rgba(var(--primary-rgb), 0.1)'
            }}>
              <Users size={32} color="var(--primary)" />
            </div>
            <h3 className="font-bold text-lg text-gray-800">{c.name}</h3>
            <span className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-tighter italic">{c.specialty}</span>
            <div className="bg-blue-50 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-blue-100">
              {Number(c.commission_rate || 50).toFixed(0)}% de Comissão
            </div>
            <div className="flex gap-3 w-full pt-4 border-t border-gray-50">
              <button 
                className="btn w-full bg-gray-50 text-gray-600 hover:bg-gray-100 border-none" 
                style={{ padding: '10px' }}
                onClick={() => openModal(c)}
              >
                <Edit2 size={16} /> Editar
              </button>
              <button 
                className="btn w-14 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border-none" 
                style={{ padding: '0' }}
                onClick={() => {
                  setDeleteId(c.id);
                  setShowConfirm(true);
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div className="card w-full animate-scale" style={{ maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={closeModal}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', color: '#94a3b8' }}
            >
              <X size={20} />
            </button>
            <h3 className="font-bold mb-6">{editingId ? 'Editar Colaboradora' : 'Cadastrar Colaboradora'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Completo</label>
                <input 
                  placeholder="Ex: Ana Silva" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Especialidade</label>
                <input 
                  placeholder="Ex: Cabeleireira" 
                  value={formData.specialty}
                  onChange={e => setFormData({...formData, specialty: e.target.value})}
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">E-mail de Acesso</label>
                <input 
                  type="email"
                  placeholder="email@exemplo.com" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Senha {editingId ? '(Deixe em branco para não alterar)' : ''}</label>
                <input 
                  type="password"
                  placeholder="******" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!editingId}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Comissão (%)</label>
                <div className="flex items-center gap-2 border rounded-xl px-3 bg-gray-50">
                   <input 
                    type="number"
                    placeholder="50" 
                    value={formData.commission_rate}
                    onChange={e => setFormData({...formData, commission_rate: parseFloat(e.target.value)})}
                    required 
                    style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%' }}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" className="btn w-full bg-gray-100" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary w-full">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div className="card w-full animate-scale" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: '#fee2e2', 
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Trash2 size={30} />
            </div>
            <h3 className="font-bold text-xl mb-2">Excluir Colaboradora</h3>
            <p className="text-gray-500 mb-8">Tem certeza que deseja remover esta colaboradora? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button 
                className="btn w-full" 
                style={{ background: '#f1f5f9', color: '#64748b' }} 
                onClick={() => setShowConfirm(false)}
              >
                Manter
              </button>
              <button 
                className="btn w-full text-white" 
                style={{ background: '#dc2626', fontWeight: 700 }} 
                onClick={handleDelete}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collaborators;
