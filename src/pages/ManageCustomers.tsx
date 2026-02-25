import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { Plus, Search, Phone, Mail, Edit2, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const ManageCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cliente')
      .select('*')
      .order('name');
    
    if (data) setCustomers(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('cliente').update(formData).eq('id', editingId);
      if (!error) {
        addNotification('Atualizado', `${formData.name} atualizada com sucesso.`, 'success');
        closeModal();
        fetchCustomers();
      }
    } else {
      const { error } = await supabase.from('cliente').insert([formData]);
      if (!error) {
        addNotification('Cliente Cadastrado', `${formData.name} foi adicionado(a) com sucesso.`, 'success');
        closeModal();
        fetchCustomers();
      } else {
        addNotification('Erro', 'Não foi possível cadastrar o cliente.', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('cliente').delete().eq('id', deleteId);
    if (!error) {
      addNotification('Excluído', 'Cliente removido com sucesso.', 'info');
      setShowConfirm(false);
      setDeleteId(null);
      fetchCustomers();
    }
  };

  const openModal = (customer?: any) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({ 
        name: customer.name, 
        phone: customer.phone || '', 
        email: customer.email || '' 
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '' });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>Gestão de Clientes</h2>
          <p style={{ color: '#64748b' }}>Cadastre e gerencie os contatos de suas clientes.</p>
        </div>
        <button className="btn btn-primary w-full md:w-auto" onClick={() => openModal()}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 border p-3 rounded-xl flex-grow bg-gray-50">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Buscar cliente por nome ou celular..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }} 
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Telefone</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">E-mail</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">Carregando clientes...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</td></tr>
              ) : filteredCustomers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-50)' }} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0" style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {c.phone || '-'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {c.email || '-'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(c)}
                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => { setDeleteId(c.id); setShowConfirm(true); }}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {loading ? (
            <p className="p-8 text-center text-gray-400 italic">Carregando clientes...</p>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
              Nenhuma cliente encontrada.
            </div>
          ) : filteredCustomers.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl border-2 border-gray-100 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-lg leading-tight">{c.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Cliente cadastrada</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 py-4 border-y border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                    <Phone size={14} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{c.phone || 'Sem telefone'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                    <Mail size={14} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{c.email || 'Sem e-mail'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => openModal(c)}
                  className="btn flex-1 bg-gray-50 text-gray-600 hover:bg-gray-100" 
                  style={{ padding: '10px' }}
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button 
                  onClick={() => { setDeleteId(c.id); setShowConfirm(true); }}
                  className="btn flex-1 bg-red-50 text-red-600 hover:bg-red-100"
                  style={{ padding: '10px' }}
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
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
            <h3 className="font-bold mb-6">{editingId ? 'Editar Cliente' : 'Cadastrar Cliente'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Completo</label>
                <input 
                  placeholder="Ex: Maria Souza" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Telefone / WhatsApp</label>
                <div className="flex items-center gap-2 border rounded-xl px-3 bg-gray-50">
                  <Phone size={16} color="var(--primary)" />
                  <input 
                    placeholder="Ex: 73999999999" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%' }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">E-mail</label>
                <div className="flex items-center gap-2 border rounded-xl px-3 bg-gray-50">
                  <Mail size={16} color="var(--primary)" />
                  <input 
                    type="email"
                    placeholder="cliente@email.com" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div className="card w-full animate-scale" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 color="#dc2626" size={30} />
            </div>
            <h3 className="font-bold text-xl mb-2">Excluir Cliente?</h3>
            <p className="text-gray-500 mb-8 px-4">Esta ação não pode ser desfeita. O cliente será removido permanentemente da sua base.</p>
            <div className="flex gap-4">
              <button className="btn w-full bg-gray-100" onClick={() => setShowConfirm(false)}>Manter</button>
              <button className="btn w-full text-white bg-red-600" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers;
