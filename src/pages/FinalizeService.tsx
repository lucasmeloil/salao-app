import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { Calculator, ArrowRight, Minus, Calendar, Check, Search, ShoppingBag, Plus } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const FinalizeService = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [usedProducts, setUsedProducts] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'value' | 'percent'>('value');
  const [serviceBaseValue, setServiceBaseValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useNotifications();

  const COMPANY_INFO = {
    name: "ARCA SALÃO E ESTÉTICA",
    cnpj: "00.000.000/0001-00",
    address: "Rua Principal, 123 - Centro",
    phone: "(73) 99999-9999"
  };

  useEffect(() => {
    fetchPendingAppointments();
    fetchProducts();
  }, []);

  const fetchPendingAppointments = async () => {
    // Busca agendamentos que ainda não foram finalizados nem rejeitados
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, cliente(name, phone), users(name, commission_rate)')
      .in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } else if (data) {
      setAppointments(data);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  };

  const addProduct = (p: any) => {
    setUsedProducts([...usedProducts, p]);
  };

  const removeProduct = (idx: number) => {
    setUsedProducts(usedProducts.filter((_, i) => i !== idx));
  };

  const calculateTotal = () => {
    const productsValue = usedProducts.reduce((acc, p) => acc + Number(p.price), 0);
    const subtotal = serviceBaseValue + productsValue;
    let final = subtotal;
    if (discountType === 'value') final -= discount;
    else final -= subtotal * (discount / 100);
    return final > 0 ? final : 0;
  };

  const handleFinalize = async () => {
    if (!selectedApp) return;
    
    const final_value = calculateTotal();
    const products_value = usedProducts.reduce((acc, p) => acc + Number(p.price), 0);
    const saleData = {
      appointment_id: selectedApp.id,
      collaborator_id: selectedApp.collaborator_id,
      product_ids: usedProducts.map(p => p.id),
      total_value: serviceBaseValue + products_value,
      service_value: serviceBaseValue,
      products_value: products_value,
      discount_value: discountType === 'value' ? discount : ((serviceBaseValue + products_value) * discount / 100),
      discount_percent: discountType === 'percent' ? discount : 0,
      final_value,
      payment_method: paymentMethod
    };

    const { data: saleRes, error } = await supabase.from('services_finalized').insert([saleData]).select().single();

    if (!error) {
      // Forçamos a atualização do status para 'finalized' com verificação de erro
      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({ status: 'finalized' })
        .eq('id', selectedApp.id);
      
      if (updateError) {
        console.error("CRITICAL: Failed to update appointment status to finalized:", updateError);
      }
      
      // Update Stock for each product used
      for (const p of usedProducts) {
        await supabase.rpc('decrement_product_stock', { row_id: p.id, quantity_to_remove: 1 });
      }

      // Prepare data for receipt
      setLastSale({
        ...saleRes,
        client_name: selectedApp.cliente?.name || selectedApp.client_name,
        collaborator_name: selectedApp.users?.name,
        service: selectedApp.service,
        services_list: selectedApp.services_list || [],
        products: usedProducts,
        subtotal: serviceBaseValue + usedProducts.reduce((acc, p) => acc + Number(p.price), 0),
        discount_display: discountType === 'value' ? discount : ((serviceBaseValue + usedProducts.reduce((acc, p) => acc + Number(p.price), 0)) * discount / 100)
      });
      
      setShowReceipt(true);
      setSelectedApp(null);
      setUsedProducts([]);
      setDiscount(0);
      setServiceBaseValue(0);
      fetchPendingAppointments();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Finalizar e Faturar</h2>
          <p className="text-gray-500">Selecione um cliente para processar o pagamento e emitir o cupom.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="card h-full min-h-[400px]">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Agendamentos do Dia
            </h3>
            <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
              {appointments.map(app => (
                <div 
                  key={app.id} 
                  className={`p-5 cursor-pointer rounded-2xl border-2 transition-all relative overflow-hidden group ${selectedApp?.id === app.id ? 'border-primary bg-pink-50/30' : 'border-gray-100 hover:border-pink-200 bg-white shadow-sm'}`}
                  onClick={() => {
                    setSelectedApp(app);
                    if (app.service_value) {
                      setServiceBaseValue(app.service_value);
                    } else {
                      setServiceBaseValue(0);
                    }
                  }}
                >
                  {selectedApp?.id === app.id && (
                    <div className="absolute top-0 right-0 p-1.5 bg-primary text-white rounded-bl-xl">
                      <Check size={14} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <p className="font-black text-gray-800 uppercase tracking-tight">{app.cliente?.name || app.client_name}</p>
                    <p className="text-xs font-bold text-primary truncate">{app.service}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-widest">{app.time}</span>
                      <span className="text-xs font-black text-gray-600">R$ {Number(app.service_value || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <Calendar size={40} className="opacity-20" />
                  <p className="text-sm font-medium">Sem agendamentos no momento</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
        {selectedApp ? (
          <>
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">Detalhes do Recebimento</h3>
                <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem' }}>
                  {selectedApp.cliente?.name || selectedApp.client_name} - {selectedApp.users?.name || 'Profissional'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Valor Base do Serviço (R$)</label>
                    <input 
                      type="number" 
                      value={serviceBaseValue}
                      onChange={e => setServiceBaseValue(parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cesta de Produtos</label>
                    
                    {/* Search and List area */}
                    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text"
                          placeholder="Buscar produto..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-10 w-full bg-white border-gray-200"
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {products
                          .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                          .slice(0, 5)
                          .map(p => (
                            <div 
                              key={p.id} 
                              className="flex justify-between items-center p-2 bg-white rounded-xl border border-gray-100 hover:border-primary/30 transition-colors shadow-sm cursor-pointer group"
                              onClick={() => {
                                addProduct(p);
                                addNotification('Produto Adicionado', `${p.name} adicionado ao carrinho.`, 'info');
                                setSearchTerm('');
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-700">{p.name}</span>
                                <span className="text-[10px] text-gray-400">Estoque: {p.quantity} un.</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-primary">R$ {Number(p.price).toFixed(2)}</span>
                                <div className="p-1 bg-gray-50 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                  <Plus size={12} />
                                </div>
                              </div>
                            </div>
                          ))}
                        {products.length === 0 && <p className="text-[10px] text-center text-gray-400 py-4">Nenhum produto cadastrado</p>}
                      </div>
                    </div>

                    {/* Cart area */}
                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag size={12} /> Itens no Carrinho
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {usedProducts.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 bg-pink-50 border border-pink-100 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors group">
                            <span className="text-[11px] font-bold text-primary">{p.name} - R$ {Number(p.price).toFixed(2)}</span>
                            <button 
                              onClick={() => removeProduct(i)} 
                              className="text-pink-300 hover:text-red-500 transition-colors"
                            >
                              <Minus size={12} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                        {usedProducts.length === 0 && (
                          <span className="text-[10px] text-gray-300 italic">Nenhum produto na cesta</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="flex flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Desconto</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={discount}
                        onChange={e => setDiscount(parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <select 
                        value={discountType}
                        onChange={e => setDiscountType(e.target.value as any)}
                        style={{ width: '80px' }}
                      >
                        <option value="value">R$</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Método de Pagamento</label>
                      <select 
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full"
                      >
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-auto p-6 rounded-2xl bg-gray-900 text-white flex flex-col gap-4">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>R$ {(serviceBaseValue + usedProducts.reduce((acc, p) => acc + Number(p.price), 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Desconto</span>
                      <span>- R$ {(discountType === 'value' ? discount : (serviceBaseValue + usedProducts.reduce((acc, p) => acc + Number(p.price), 0)) * discount / 100).toFixed(2)}</span>
                    </div>
                    <div style={{ height: '1px', background: '#333' }}></div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total Final</span>
                      <span className="font-bold" style={{ fontSize: '1.75rem', color: 'var(--primary)' }}>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="mt-2 p-3 rounded-xl bg-gray-800 flex flex-col gap-1 text-xs">
                       <div className="flex justify-between items-center">
                         <span className="text-gray-400">Comissão (Sobre Serviço - {selectedApp.users?.commission_rate || 50}%)</span>
                         <span className="text-primary font-bold">R$ {(serviceBaseValue * (selectedApp.users?.commission_rate || 50) / 100).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-1 border-t border-gray-700/50">
                         <span className="text-gray-400">Produtos (100% Salão)</span>
                         <span className="text-white font-medium">R$ {usedProducts.reduce((acc, p) => acc + Number(p.price), 0).toFixed(2)}</span>
                       </div>
                    </div>

                    <button className="btn btn-primary w-full mt-2" onClick={handleFinalize}>
                      Finalizar e Registrar <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
            <div className="card h-full flex flex-col items-center justify-center text-gray-400 gap-4">
              <Calculator size={48} strokeWidth={1} />
              <p className="font-medium">Selecione um cliente para iniciar o faturamento</p>
            </div>
          )}
        </div>
      </div>

      {/* Mini PDV Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-[400px] rounded-2xl p-8 shadow-2xl animate-scale print:shadow-none print:max-w-full print:rounded-none">
            <div className="print-area flex flex-col gap-4">
              {/* Header */}
              <div className="text-center border-b border-dashed border-gray-300 pb-4">
                <h2 className="font-black text-xl tracking-tighter">{COMPANY_INFO.name}</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">CNPJ: {COMPANY_INFO.cnpj}</p>
                <p className="text-[10px] text-gray-500 uppercase">{COMPANY_INFO.address}</p>
                <p className="text-[10px] text-gray-500 font-bold">{COMPANY_INFO.phone}</p>
              </div>

              {/* Receipt Info */}
              <div className="flex justify-between text-[10px] font-bold text-gray-400 py-2 border-b border-dashed border-gray-100">
                <span>CUPOM Nº {lastSale.id.toString().padStart(6, '0')}</span>
                <span>{new Date().toLocaleString()}</span>
              </div>

              {/* Client & Professional */}
              <div className="py-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Cliente</p>
                <p className="text-sm font-bold uppercase tracking-tight">{lastSale.client_name}</p>
                <div className="flex justify-between mt-2">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Profissional</p>
                    <p className="text-xs font-bold">{lastSale.collaborator_name || 'NÃO INFORMADO'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pagamento</p>
                    <p className="text-xs font-bold uppercase">{lastSale.payment_method}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="py-4 border-t border-b border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-400 uppercase">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-right pb-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSale.services_list && lastSale.services_list.length > 0 ? (
                      lastSale.services_list.map((s: any, i: number) => (
                        <tr key={i}>
                          <td className="py-1">{s.name}</td>
                          <td className="text-right py-1">R$ {Number(s.price).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-1">{lastSale.service}</td>
                        <td className="text-right py-1">R$ {Number(lastSale.service_value || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    {lastSale.products.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="py-1 text-gray-500">{p.name}</td>
                        <td className="text-right py-1 text-gray-500">R$ {Number(p.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-2 py-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">SUBTOTAL</span>
                  <span className="font-bold">R$ {lastSale.subtotal.toFixed(2)}</span>
                </div>
                {lastSale.discount_display > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span className="font-bold">DESCONTO (-)</span>
                    <span className="font-bold">R$ {lastSale.discount_display.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black mt-2">
                  <span>TOTAL</span>
                  <span className="text-primary">R$ {Number(lastSale.final_value).toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 opacity-30">
                <p className="text-[9px] font-bold italic">Obrigado pela preferência!</p>
                <p className="text-[8px] mt-1">Este documento é um simulado de cupom fiscal.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 mt-8 print:hidden">
              <button className="btn btn-dark flex-1" onClick={() => setShowReceipt(false)}>Fechar</button>
              <button 
                className="btn btn-primary flex-1 flex items-center justify-center gap-2 shadow-lg shadow-pink-200" 
                onClick={handlePrint}
              >
                Imprimir Cupom
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
          }
          @page { margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default FinalizeService;
