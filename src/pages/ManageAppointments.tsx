import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { Plus, MessageSquare, Check, X, Calendar as CalendarIcon, User, Scissors } from 'lucide-react';
import { sendWhatsAppConfirmation } from '../utils/whatsapp';
import { useNotifications } from '../context/NotificationContext';

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCollaboratorId, setActiveCollaboratorId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cliente_id: '',
    service: '',
    date: '',
    time: '',
    collaborator_id: '',
    duration: 60
  });
  const [confirmModal, setConfirmModal] = useState<{show: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'info'}>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });
  
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (collaborators.length > 0 && !activeCollaboratorId) {
      setActiveCollaboratorId(collaborators[0].id.toString());
    }
  }, [collaborators]);

  // Standard business hours for the visual schedule
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [appsRes, collabsRes, servicesRes, clientsRes] = await Promise.all([
      supabase.from('agendamentos').select('*, users(name), cliente(name, phone)')
        .order('date', { ascending: true })
        .order('time', { ascending: true }),
      supabase.from('users').select('*'),
      supabase.from('services').select('*'),
      supabase.from('cliente').select('*')
    ]);

    if (appsRes.error) {
      console.error("Erro ao buscar agendamentos:", appsRes.error);
      addNotification('Erro', 'Não foi possível carregar os agendamentos.', 'error');
    }

    if (appsRes.data) setAppointments(appsRes.data);
    if (collabsRes.data) setCollaborators(collabsRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceNames = selectedServices.map(s => s.name).join(', ');
    const totalDuration = selectedServices.reduce((acc, s) => acc + (s.duration || 60), 0);
    const totalPrice = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);
    
    // Check for conflicts
    const [h, m] = formData.time.split(':').map(Number);
    const newStart = h * 60 + m;
    const newEnd = newStart + totalDuration;

    const conflict = appointments.find(app => {
      if (Number(app.collaborator_id) === Number(formData.collaborator_id) && app.date === formData.date && app.status !== 'rejected') {
        const [ah, am] = app.time.split(':').map(Number);
        const aStart = ah * 60 + am;
        const aEnd = aStart + (app.duration || 60);
        return (newStart < aEnd) && (newEnd > aStart);
      }
      return false;
    });

    if (conflict) {
      addNotification('Conflito de Horário', `Este profissional já tem um compromisso que termina às ${Math.floor((conflict.time.split(':')[0]*60 + parseInt(conflict.time.split(':')[1]) + (conflict.duration || 60))/60).toString().padStart(2, '0')}:${((conflict.time.split(':')[0]*60 + parseInt(conflict.time.split(':')[1]) + (conflict.duration || 60))%60).toString().padStart(2, '0')}.`, 'error');
      return;
    }

    const selectedClient = clients.find((c: any) => c.id.toString() === formData.cliente_id);
    const submissionData = {
      ...formData,
      service: serviceNames,
      services_list: selectedServices, // New column to store itemized services
      duration: totalDuration,
      service_value: totalPrice,
      client_name: selectedClient?.name || '',
      status: 'confirmed'
    };
    
    const { error } = await supabase.from('agendamentos').insert([submissionData]);
    if (!error) {
      addNotification('Novo Agendamento', `Cliente ${selectedClient?.name} agendado para ${formData.date} às ${formData.time} (R$ ${totalPrice.toFixed(2)}).`, 'info');
      setShowModal(false);
      fetchData();
      setFormData({ cliente_id: '', service: '', date: '', time: '', collaborator_id: '', duration: 60 });
      setSelectedServices([]);
    } else {
      addNotification('Erro no Agendamento', 'Não foi possível salvar o agendamento.', 'error');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id);
      if (error) throw error;
      addNotification('Sucesso', `Agendamento ${status === 'confirmed' ? 'confirmado' : 'recusado'} com sucesso.`, 'success');
      await fetchData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      addNotification('Erro', 'Não foi possível atualizar o status do agendamento.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      show: true,
      title: 'Excluir Agendamento',
      message: 'Tem certeza que deseja excluir este agendamento definitivamente? Esta ação não pode ser desfeita.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('agendamentos').delete().eq('id', id);
          if (error) throw error;
          addNotification('Excluído', 'Agendamento removido com sucesso.', 'success');
          await fetchData();
        } catch (error) {
          addNotification('Erro', 'Não foi possível excluir o agendamento.', 'error');
        }
        setConfirmModal((prev: any) => ({ ...prev, show: false }));
      }
    });
  };

  const handleConfirmWhatsApp = async (app: any) => {
    const phone = app.client_phone || app.cliente?.phone || '';
    const totalMatch = app.service?.match(/VALOR TOTAL: (R\$ [\d,.]+)/);
    const total = totalMatch ? totalMatch[1] : undefined;
    sendWhatsAppConfirmation(app.client_name || app.cliente?.name || '', app.service, app.date, app.time, phone, total);
    await supabase.from('agendamentos').update({ confirmed_whatsapp: true }).eq('id', app.id);
    fetchData();
  };

  const isSlotOccupied = (collabId: number, time: string, date: string) => {
    const [th, tm] = time.split(':').map(Number);
    const tStart = th * 60 + tm;
    const tEnd = tStart + 60; // Slot range (hourly)

    return appointments.find(app => {
      // Inclui todos os status exceto os explicitamente rejeitados
      if (Number(app.collaborator_id) === Number(collabId) && 
          app.date === date && 
          app.status !== 'rejected') {
        const [ah, am] = app.time.split(':').map(Number);
        const aStart = ah * 60 + am;
        const aEnd = aStart + (app.duration || 60);

        // Check if slot [tStart, tEnd) overlaps with appointment [aStart, aEnd)
        return (tStart < aEnd) && (tEnd > aStart);
      }
      return false;
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Gestão de Agendas</h2>
          <p className="text-gray-500">Controle seus horários e serviços em tempo real.</p>
        </div>
        <button className="btn btn-primary shadow-lg shadow-pink-200 w-full md:w-auto" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      {/* Visual Schedule Matrix */}
      <div className="card overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h3 className="font-bold flex items-center gap-2">
            <CalendarIcon size={20} color="var(--primary)" /> Quadro de Horários
          </h3>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter by Collaborator */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 px-3 rounded-xl border border-gray-200 flex-1 md:flex-initial">
              <User size={16} className="text-gray-400" />
              <select 
                value={activeCollaboratorId || ''} 
                onChange={e => setActiveCollaboratorId(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--dark)', outline: 'none', fontSize: '0.9rem' }}
                className="w-full"
              >
                {collaborators.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Date */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 px-3 rounded-xl border border-gray-200 flex-1 md:flex-initial">
              <CalendarIcon size={16} className="text-gray-400" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--dark)', outline: 'none', fontSize: '0.9rem' }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex w-full overflow-hidden rounded-2xl border border-gray-100 bg-white" style={{ minHeight: '600px' }}>
          {/* Hours Column (Fixed) */}
          <div className="flex flex-col gap-2 p-2 border-r border-gray-100 bg-gray-50 z-10" style={{ width: '90px' }}>
            <div className="h-16 flex items-center justify-center font-bold text-gray-400 text-[10px] uppercase tracking-wider">Horário</div>
            {timeSlots.map(time => (
              <div key={time} className="h-[50px] flex items-center justify-center font-bold text-gray-600 text-sm bg-white rounded-lg shadow-sm border border-gray-50">
                {time}
              </div>
            ))}
          </div>

          {/* Active Collaborator Agenda */}
          <div className="flex-grow p-4">
            {activeCollaboratorId ? (
              <div className="flex flex-col gap-2">
                {/* Header for Selected Collab */}
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 shadow-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-100 rounded-full">
                      <User size={18} className="text-primary" />
                    </div>
                    <span className="font-extrabold text-gray-800 uppercase tracking-tight">
                      {collaborators.find((c: any) => c.id.toString() === activeCollaboratorId)?.name || 'Colaboradora'}
                    </span>
                  </div>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {timeSlots.map(time => {
                    const collabIdNum = parseInt(activeCollaboratorId);
                    const app = isSlotOccupied(collabIdNum, time, selectedDate);
                    const occupied = !!app;
                    const isPending = app?.status === 'pending';
                    const isFinalized = app?.status === 'finalized';
                    
                    return (
                      <div 
                        key={time}
                        onClick={() => {
                          if (!occupied) {
                            setFormData({ ...formData, time, collaborator_id: activeCollaboratorId, date: selectedDate });
                            setShowModal(true);
                          } else {
                            setSelectedAppointment(app);
                            setShowDetailsModal(true);
                          }
                        }}
                        className={`relative ${!occupied ? "hover:scale-[1.005] active:scale-[0.99] cursor-pointer" : "cursor-pointer"} transition-all duration-200 flex items-center p-3 px-6`}
                        style={{
                          height: '50px',
                          borderRadius: '16px',
                          background: !occupied ? '#f0fdf4' : (isFinalized ? '#f0f9ff' : (isPending ? '#fefce8' : '#fff1f2')),
                          border: `1.5px solid ${!occupied ? '#bbf7d0' : (isFinalized ? '#bae6fd' : (isPending ? '#fef08a' : '#fecaca'))}`,
                        }}
                      >
                         <div className="flex items-center gap-3 w-full">
                           <div className="p-1 px-2 rounded-lg bg-white/50 border border-white/20">
                             {!occupied ? <Plus size={14} className="text-green-600" /> : (isFinalized ? <Check size={14} className="text-blue-600" /> : (isPending ? <CalendarIcon size={14} className="text-yellow-700" /> : <Scissors size={14} className="text-red-600" />))}
                           </div>
                           <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: !occupied ? '#15803d' : (isFinalized ? '#0369a1' : (isPending ? '#a16207' : '#be123c')) }} className="uppercase">
                             {!occupied ? 'Horário Disponível' : (isFinalized ? 'Atendimento Finalizado' : (isPending ? 'Aguardando Confirmação' : 'Horário Ocupado'))}
                           </span>
                           {occupied && (
                             <div className="ml-auto flex items-center gap-2">
                               <div className="h-1.5 w-1.5 rounded-full bg-current opacity-30"></div>
                               <span className="text-xs font-bold text-gray-700">
                                 {app.cliente?.name || app.client_name}
                               </span>
                             </div>
                           )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                <User size={48} className="opacity-20" />
                <p className="font-medium">Selecione uma colaboradora para ver os horários</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* List View */}
      <div className="card">
        <h3 className="font-bold mb-6">Lista Detalhada</h3>
        
        {/* Desktop View Table */}
        <div className="hidden-mobile overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                <th className="p-4 text-gray-400 font-medium">Cliente</th>
                <th className="p-4 text-gray-400 font-medium">Serviço</th>
                <th className="p-4 text-gray-400 font-medium">Data/Hora</th>
                <th className="p-4 text-gray-400 font-medium">Colaboradora</th>
                <th className="p-4 text-gray-400 font-medium">WhatsApp</th>
                <th className="p-4 text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center">Carregando...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center">Nenhum agendamento encontrado</td></tr>
              ) : appointments.map((app: any) => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td className="p-4 font-bold">{app.cliente?.name || app.client_name}</td>
                  <td className="p-4">
                    <span className="badge" style={{ background: '#f1f5f9', color: 'var(--dark)' }}>{app.service}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span>{new Date(app.date).toLocaleDateString()}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>{app.time}</span>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{app.users?.name || '-'}</td>
                  <td className="p-4">
                    {app.confirmed_whatsapp ? (
                      <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Enviado
                      </span>
                    ) : (
                      <button 
                        className="btn" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#dcfce7', color: '#16a34a', borderRadius: '8px' }}
                        onClick={() => handleConfirmWhatsApp(app)}
                      >
                        <MessageSquare size={14} /> Confirmar
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                       {(!app.status || app.status === 'pending') && (
                         <div className="flex gap-1">
                           <button 
                             className="p-2 hover:bg-green-100 rounded-full transition-colors" 
                             style={{ color: '#16a34a', background: '#dcfce7' }}
                             title="Aceitar"
                             onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                           >
                             <Check size={16} />
                           </button>
                           <button 
                             className="p-2 hover:bg-red-100 rounded-full transition-colors" 
                             style={{ color: '#dc2626', background: '#fee2e2' }}
                             title="Recusar"
                             onClick={() => handleUpdateStatus(app.id, 'rejected')}
                           >
                             <X size={16} />
                           </button>
                         </div>
                       )}
                       {app.status === 'confirmed' && (
                         <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>Confirmado</span>
                       )}
                       {app.status === 'rejected' && (
                         <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>Recusado</span>
                       )}
                       {app.status === 'completed' && (
                         <span className="badge" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>Finalizado</span>
                       )}
                       <button 
                         className="p-2 hover:bg-red-50 rounded-full transition-colors" 
                         style={{ color: '#ef4444' }} 
                         title="Excluir Permanentemente"
                         onClick={() => handleDelete(app.id)}
                       >
                         <X size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="mobile-only flex flex-col gap-4">
           {loading ? (
             <p className="text-center p-4">Carregando...</p>
           ) : appointments.length === 0 ? (
             <p className="text-center p-4">Nenhum agendamento encontrado</p>
           ) : appointments.map((app: any) => (
             <div key={app.id} className="p-4 rounded-xl border border-gray-100 flex flex-col gap-3" style={{ background: '#f8fafc' }}>
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="font-bold text-lg">{app.cliente?.name || app.client_name}</h4>
                   <span className="badge mt-1" style={{ background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)' }}>{app.service}</span>
                 </div>
                 <div className="text-right">
                    <p className="font-bold text-gray-900">{new Date(app.date).toLocaleDateString()}</p>
                    <p className="font-bold text-primary">{app.time}</p>
                 </div>
               </div>
               
               <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                 <span className="text-sm font-medium text-gray-600">Pro: {app.users?.name || '-'}</span>
                 <div>
                    {app.confirmed_whatsapp ? (
                      <span className="text-green-600 font-bold text-xs">WhatsApp OK</span>
                    ) : (
                      <button 
                        className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded-lg"
                        onClick={() => handleConfirmWhatsApp(app)}
                      >
                        Confirmar Whats
                      </button>
                    )}
                 </div>
               </div>

               <div className="flex justify-end gap-2 mt-1">
                  {(!app.status || app.status === 'pending') && (
                    <>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                      >
                        Aceitar
                      </button>
                      <button 
                        className="btn btn-dark" 
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#dc2626' }}
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                      >
                        Recusar
                      </button>
                    </>
                  )}
                  {app.status === 'confirmed' && (
                    <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>Confirmado</span>
                  )}
                  {app.status === 'rejected' && (
                    <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>Recusado</span>
                  )}
                  {app.status === 'completed' && (
                    <span className="badge" style={{ background: '#f8fafc', color: '#64748b' }}>Finalizado</span>
                  )}
                  <button 
                    className="btn btn-dark" 
                    style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626' }}
                    onClick={() => handleDelete(app.id)}
                  >
                    Excluir
                  </button>
               </div>
             </div>
           ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div className="card w-full" style={{ maxWidth: '500px' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Novo Agendamento</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                <select 
                  value={formData.cliente_id}
                  onChange={e => setFormData({...formData, cliente_id: e.target.value})}
                  required
                >
                  <option value="">Selecione a Cliente</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Serviços (Selecione um ou mais)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedServices.map(s => (
                    <div key={s.id} className="bg-pink-100 text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      {s.name}
                      <button type="button" onClick={() => setSelectedServices(prev => prev.filter(item => item.id !== s.id))}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <select 
                  onChange={e => {
                    const s = services.find(sv => sv.id.toString() === e.target.value);
                    if (s && !selectedServices.find(item => item.id === s.id)) {
                      setSelectedServices([...selectedServices, s]);
                    }
                  }}
                  className="w-full"
                >
                  <option value="">Adicionar Serviço...</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration} min) - R$ {Number(s.price).toFixed(2)}
                    </option>
                  ))}
                </select>
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Previsão</span>
                  <span className="text-xs font-bold text-primary">
                    {selectedServices.reduce((acc, s) => acc + (s.duration || 60), 0)} min | R$ {selectedServices.reduce((acc, s) => acc + Number(s.price), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Horário</label>
                  <input 
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Colaboradora</label>
                <select 
                  value={formData.collaborator_id}
                  onChange={e => setFormData({...formData, collaborator_id: e.target.value})}
                  required
                >
                  <option value="">Selecione a Colaboradora</option>
                  {collaborators.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" className="btn w-full font-bold" onClick={() => setShowModal(false)} style={{ border: '1px solid var(--gray-200)' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary w-full font-bold">Confirmar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div className="card w-full animate-scale" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: confirmModal.type === 'danger' ? '#fee2e2' : '#fef9c3', 
              color: confirmModal.type === 'danger' ? '#dc2626' : '#a16207',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              {confirmModal.type === 'danger' ? <X size={30} /> : <CalendarIcon size={30} />}
            </div>
            <h3 className="font-bold text-xl mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                className="btn w-full" 
                style={{ background: '#f1f5f9', color: '#64748b' }} 
                onClick={() => setConfirmModal((prev: any) => ({ ...prev, show: false }))}
              >
                Cancelar
              </button>
              <button 
                className="btn w-full text-white" 
                style={{ background: confirmModal.type === 'danger' ? '#dc2626' : 'var(--primary)', fontWeight: 700 }} 
                onClick={confirmModal.onConfirm}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, backdropFilter: 'blur(10px)', padding: '20px' }}>
          <div className="card w-full animate-scale" style={{ maxWidth: '450px' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CalendarIcon size={20} className="text-primary" /> Detalhes do Agendamento
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Status Header */}
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ 
                background: selectedAppointment.status === 'confirmed' ? '#f0fdf4' : (selectedAppointment.status === 'pending' ? '#fefce8' : '#f8fafc'),
                border: `1.5px solid ${selectedAppointment.status === 'confirmed' ? '#bbf7d0' : (selectedAppointment.status === 'pending' ? '#fef08a' : '#e2e8f0')}`
              }}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status Atual</span>
                  <span className={`font-bold uppercase text-sm ${selectedAppointment.status === 'confirmed' ? 'text-green-700' : (selectedAppointment.status === 'pending' ? 'text-yellow-700' : 'text-gray-700')}`}>
                    {selectedAppointment.status === 'confirmed' ? 'Confirmado' : (selectedAppointment.status === 'pending' ? 'Pendente' : 'Finalizado')}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {selectedAppointment.status === 'confirmed' ? <Check size={18} className="text-green-500" /> : <CalendarIcon size={18} className="text-yellow-500" />}
                </div>
              </div>

              {/* Client Info */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informações do Cliente</h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{selectedAppointment.cliente?.name || selectedAppointment.client_name}</span>
                      <span className="text-sm text-gray-500">{selectedAppointment.cliente?.phone || 'Telefone não cadastrado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Serviço Agendado</h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Serviço</span>
                    <span className="font-bold text-gray-800">{selectedAppointment.service}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Profissional</span>
                    <span className="font-bold text-gray-800">{selectedAppointment.collaborators?.name || 'Não definida'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Data</span>
                    <span className="font-bold text-gray-800">{new Date(selectedAppointment.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Horário</span>
                    <span className="font-bold text-gray-800">{selectedAppointment.time}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button 
                  className="btn btn-dark w-full"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fechar
                </button>
                {selectedAppointment.cliente?.phone && (
                  <button 
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      handleConfirmWhatsApp(selectedAppointment);
                      setShowDetailsModal(false);
                    }}
                  >
                    <MessageSquare size={18} /> Reenviar Confirm.
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments;
