import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { Plus, Search, Edit2, Trash2, Clock, DollarSign } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const ManageServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching services:', error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration)
    };

    if (editingId) {
      const { error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingId);
      if (!error) {
        addNotification('Serviço Atualizado', `O serviço "${formData.name}" foi atualizado com sucesso.`, 'success');
        setShowModal(false);
        fetchServices();
      }
    } else {
      const { error } = await supabase
        .from('services')
        .insert([payload]);
      if (!error) {
        addNotification('Serviço Criado', `O serviço "${formData.name}" foi cadastrado com sucesso.`, 'success');
        setShowModal(false);
        fetchServices();
      }
    }
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      if (!error) {
        addNotification('Serviço Excluído', `O serviço foi removido do sistema.`, 'info');
        fetchServices();
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', duration: '' });
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Serviços Disponíveis</h2>
        <button className="btn btn-primary w-full md:w-auto" onClick={openNewModal}>
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 border p-2 rounded-xl bg-gray-50 flex-grow max-w-md">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Buscar serviço..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Serviço</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Preço</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Duração</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Carregando serviços...</td></tr>
              ) : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum serviço encontrado.</td></tr>
              ) : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((service) => (
                <tr key={service.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td className="p-4 font-bold text-gray-800">{service.name}</td>
                  <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{service.description || '-'}</td>
                  <td className="p-4 font-black text-primary">R$ {Number(service.price).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">
                      <Clock size={12} /> {service.duration} min
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(service)}
                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(service.id)}
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

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4">
          {loading ? (
            <p className="p-8 text-center text-gray-400 italic">Carregando serviços...</p>
          ) : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
              Nenhum serviço encontrado.
            </div>
          ) : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((service) => (
            <div key={service.id} className="p-5 rounded-2xl border-2 border-gray-100 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Serviço</span>
                  <span className="font-bold text-lg text-gray-800">{service.name}</span>
                </div>
                <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-black">
                  R$ {Number(service.price).toFixed(2)}
                </div>
              </div>
              
              {service.description && (
                <p className="text-xs text-gray-500 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                <Clock size={14} className="text-primary" /> {service.duration} MINUTOS DE DURAÇÃO
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => handleEdit(service)}
                  className="btn flex-1 bg-gray-50 text-gray-600 hover:bg-gray-100" 
                  style={{ padding: '10px' }}
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(service.id)}
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
          <div className="card w-full animate-scale" style={{ maxWidth: '400px' }}>
            <h3 className="font-bold mb-6">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Serviço</label>
                <input 
                  placeholder="Ex: Corte de Cabelo" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Descrição</label>
                <textarea 
                  placeholder="Breve descrição do serviço..." 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  style={{ resize: 'none', height: '80px', fontSize: '0.9rem' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Preço (R$)</label>
                  <div className="flex items-center gap-2 border rounded-xl px-3 bg-gray-50">
                    <DollarSign size={16} color="var(--primary)" />
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      required 
                      style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%' }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Duração (min)</label>
                  <div className="flex items-center gap-2 border rounded-xl px-3 bg-gray-50">
                    <Clock size={16} color="var(--primary)" />
                    <input 
                      type="number" 
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                      required 
                      style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" className="btn w-full bg-gray-100" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary w-full">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
