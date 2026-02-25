import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const StockControl = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', quantity: 0, price: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const { error } = await supabase.from('products').update(formData).eq('id', isEditing);
      if (!error) {
        addNotification('Atualizado', `${formData.name} atualizado com sucesso.`, 'success');
        closeModal();
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert([formData]);
      if (!error) {
        addNotification('Produto Cadastrado', `${formData.name} foi adicionado ao estoque.`, 'success');
        closeModal();
        fetchProducts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        addNotification('Excluído', 'Produto removido do estoque.', 'info');
        fetchProducts();
      }
    }
  };

  const openModal = (product?: any) => {
    if (product) {
      setIsEditing(product.id);
      setFormData({ name: product.name, quantity: product.quantity, price: product.price });
    } else {
      setIsEditing(null);
      setFormData({ name: '', quantity: 0, price: 0 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(null);
    setFormData({ name: '', quantity: 0, price: 0 });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.quantity <= 5).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Controle de Estoque</h2>
        <button className="btn btn-primary w-full md:w-auto" onClick={() => openModal()}>
          <Plus size={18} /> Cadastrar Produto
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 border p-2 rounded-xl bg-gray-50 flex-grow max-w-md">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl border border-red-100">
             <span className="font-bold text-sm">Estoque Crítico: {lowStockCount}</span>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Produto</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Quantidade</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Preço Unitário</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Carregando estoque...</td></tr>
              ) : filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td className="p-4">
                    <span className="font-bold text-gray-800">{prod.name}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-medium bg-gray-100 px-3 py-1 rounded-full text-sm">{prod.quantity} un.</span>
                  </td>
                  <td className="p-4 font-bold text-gray-700">R$ {Number(prod.price).toFixed(2)}</td>
                  <td className="p-4">
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.7rem', 
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: prod.quantity > 5 ? '#dcfce7' : '#fee2e2',
                      color: prod.quantity > 5 ? '#16a34a' : '#dc2626'
                    }}>
                      {prod.quantity > 5 ? 'Em Dia' : 'Crítico'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(prod)}
                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(prod.id)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum produto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4">
          {loading ? (
            <p className="p-8 text-center text-gray-400 italic">Carregando estoque...</p>
          ) : filteredProducts.map((prod) => (
            <div key={prod.id} className="p-5 rounded-2xl border-2 border-gray-100 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Produto</span>
                  <span className="font-bold text-lg text-gray-800">{prod.name}</span>
                </div>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.65rem', 
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: prod.quantity > 5 ? '#dcfce7' : '#fee2e2',
                  color: prod.quantity > 5 ? '#16a34a' : '#dc2626'
                }}>
                  {prod.quantity > 5 ? 'Em Dia' : 'Crítico'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Qtd Atual</span>
                  <span className="font-black text-gray-700">{prod.quantity} unidades</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Preço Unit.</span>
                  <span className="font-black text-primary">R$ {Number(prod.price).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => openModal(prod)}
                  className="btn flex-1 bg-gray-50 text-gray-600 hover:bg-gray-100" 
                  style={{ padding: '10px' }}
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(prod.id)}
                  className="btn flex-1 bg-red-50 text-red-600 hover:bg-red-100"
                  style={{ padding: '10px' }}
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            </div>
          ))}
          {!loading && filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div className="card w-full animate-scale" style={{ maxWidth: '400px' }}>
            <h3 className="font-bold mb-6">{isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Produto</label>
                <input 
                  placeholder="Ex: Shampoo Nutritivo" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Quantidade</label>
                  <input 
                    type="number" 
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Preço Unit. (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    required 
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn w-full bg-gray-100" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary w-full">
                  {isEditing ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockControl;
