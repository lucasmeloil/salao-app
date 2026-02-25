import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Phone, Clock, Instagram, Facebook, MapPin, Scissors, Star, Menu, X, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { useNotifications } from '../context/NotificationContext';

const Home = () => {
  const { addNotification } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<{show: boolean, type: 'success' | 'error'} | null>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [servicesRes, collabsRes] = await Promise.all([
        supabase.from('services').select('*').order('name'),
        supabase.from('users').select('*').order('name')
      ]);
      
      if (servicesRes.data) setServices(servicesRes.data);
      if (collabsRes.data) setCollaborators(collabsRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddService = (serviceId: string) => {
    if (!serviceId) return;
    const service = services.find(s => s.id.toString() === serviceId);
    if (service && !selectedServices.find(prev => prev.id === service.id)) {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleRemoveService = (serviceId: number) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const totalPrice = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);

  return (
    <div className="home-page">
      <nav className="glass" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: '1rem 0' }}>
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '8px' }}>
              <Scissors color="white" size={20} />
            </div>
            <span className="font-bold" style={{ fontSize: '1.25rem', letterSpacing: '1px' }}>SALÃO NEXUS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="menu-hamburguer-btn" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="mobile-overlay"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '8px' }}>
                  <Scissors color="white" size={20} />
                </div>
                <span className="font-bold" style={{ color: 'white', fontSize: '1.25rem' }}>SALÃO NEXUS</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'transparent', color: 'white' }}>
                <X size={32} />
              </button>
            </div>

            <a href="#servicos" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Serviços</a>
            <a href="#contato" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Contato</a>
            <Link to="/admin" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Painel Admin</Link>
            
            <div className="mt-auto flex flex-col gap-4">
              <button className="btn btn-primary w-full" style={{ padding: '16px' }} onClick={() => setIsMenuOpen(false)}>
                Agendar Agora <Calendar size={18} />
              </button>
              <div className="flex justify-center gap-8 mt-4">
                <Instagram color="white" size={24} />
                <Facebook color="white" size={24} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section style={{ 
        paddingTop: '120px', 
        paddingBottom: '80px',
        background: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url("https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920") center/cover'
      }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 700 }}>
                Realce sua <span style={{ color: 'var(--primary)' }}>Beleza</span> Natural
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--gray-800)', marginBottom: '2rem', maxWidth: '500px' }}>
                Experiência exclusiva em cuidados capilares, estética e bem-estar. Venha viver um momento único de transformação e relaxamento.
              </p>
              <div className="flex gap-4">
                <a href="#contato" className="btn btn-primary" style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Agendar Agora <Calendar size={18} />
                </a>
                <a href="#servicos" className="btn" style={{ border: '1px solid var(--gray-300)', padding: '16px 32px' }}>
                  Ver Serviços
                </a>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="flex justify-center">
              <div style={{ position: 'relative', width: '400px', height: '500px', borderRadius: '30px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }} className="hidden md:block">
                <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800" alt="Beleza" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="glass" style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', padding: '20px', borderRadius: '15px' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Star color="var(--primary)" fill="var(--primary)" size={16} />
                    <Star color="var(--primary)" fill="var(--primary)" size={16} />
                    <Star color="var(--primary)" fill="var(--primary)" size={16} />
                    <Star color="var(--primary)" fill="var(--primary)" size={16} />
                    <Star color="var(--primary)" fill="var(--primary)" size={16} />
                  </div>
                  <p className="font-bold">+500 Clientes Satisfeitas</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="servicos" className="p-8" style={{ background: '#fff' }}>
        <div className="container">
          <div className="text-center mb-8">
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Nossos Serviços</h2>
            <p style={{ color: 'var(--gray-800)' }}>Especialistas em transformar seu visual</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center py-20 text-gray-400">Carregando serviços...</div>
            ) : services.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-400">Nenhum serviço disponível no momento.</div>
            ) : (
              services.map((service) => (
                <motion.div 
                  key={service.id}
                  whileHover={{ y: -10 }}
                  className="card"
                  style={{ border: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                    <Scissors size={24} />
                  </div>
                  <h3 className="font-bold" style={{ marginBottom: '0.5rem' }}>{service.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', flex: 1 }}>{service.description || 'Cuidados profissionais para você.'}</p>
                  <div className="flex justify-between items-center mt-auto pt-4" style={{ borderTop: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>R$ {Number(service.price).toFixed(2)}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {service.duration} min
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="contato" className="p-8" style={{ background: '#f8fafc' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Reserve seu Momento</h2>
              <p style={{ color: 'var(--gray-800)', marginBottom: '2rem' }}>
                Escolha o serviço, a profissional de sua preferência e o melhor horário para você. Nossa equipe está pronta para te atender!
              </p>
              
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                    <MapPin color="white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Localização</h4>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Rua das Flores, 123 - Centro, Porto Seguro</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                    <Phone color="white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Telefone / WhatsApp</h4>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>(73) 99999-9999</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-2xl" style={{ border: 'none', padding: '40px' }}>
              <h3 className="font-bold mb-6 text-xl">Agendamento Online</h3>
              <form className="flex flex-col gap-4" onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const clientName = form.name.value;
                
                if (selectedServices.length === 0) {
                  alert('Por favor, selecione ao menos um serviço.');
                  return;
                }

                const serviceDetailsString = selectedServices
                  .map(s => `${s.name} (R$ ${Number(s.price).toFixed(2)})`)
                  .join(' + ');

                const clientPhone = form.phone.value;
                const { error } = await supabase.from('agendamentos').insert([{
                  client_name: clientName,
                  service: serviceDetailsString,
                  date: form.date.value,
                  time: form.time.value,
                  collaborator_id: form.collaborator.value,
                  client_phone: clientPhone
                }]);
                
                if (!error) {
                  const adminMessage = `${clientName} agendou: ${serviceDetailsString}. VALOR TOTAL: R$ ${totalPrice.toFixed(2)}. WHATSAPP: ${clientPhone}`;
                  
                  await addNotification(
                    'Novo Agendamento!',
                    adminMessage,
                    'info'
                  );
                  setBookingStatus({ show: true, type: 'success' });
                  setSelectedServices([]);
                  form.reset();
                } else {
                  setBookingStatus({ show: true, type: 'error' });
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1">Seu Nome</label>
                    <input name="name" placeholder="Ex: Maria Silva" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1">WhatsApp</label>
                    <input name="phone" placeholder="(73) 99999-9999" required type="tel" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Serviços Desejados</label>
                  
                  {selectedServices.length > 0 && (
                    <div className="flex flex-col gap-2 mb-2">
                      {selectedServices.map(s => (
                        <motion.div 
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/10"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-gray-800">{s.name}</span>
                            <span className="text-[10px] text-primary font-bold">R$ {Number(s.price).toFixed(2)}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveService(s.id)}
                            className="p-1 hover:bg-white rounded-full text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      ))}
                      <div className="flex justify-between items-center px-1 pt-2 border-t border-dashed">
                        <span className="text-xs font-black text-gray-400 uppercase">Total Estimado</span>
                        <span className="font-black text-lg text-primary">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <select 
                    value="" 
                    onChange={(e) => handleAddService(e.target.value)}
                    className="bg-gray-50 border-gray-200"
                    style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                  >
                    <option value="">+ Adicionar outro serviço...</option>
                    {services
                      .filter(s => !selectedServices.find(prev => prev.id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} - R$ {Number(s.price).toFixed(2)}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1">Data</label>
                    <input name="date" type="date" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1">Horário</label>
                    <input name="time" type="time" required />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1">Escolha a Profissional</label>
                  <select name="collaborator" required>
                    <option value="">Qualquer profissional disponível</option>
                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary w-full shadow-lg shadow-primary/20" style={{ padding: '18px', fontWeight: 800, marginTop: '16px', fontSize: '1rem' }}>
                  Finalizar Agendamento
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background: 'var(--dark)', color: 'white', padding: '60px 0 20px' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="font-bold mb-6" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>SALÃO NEXUS</h3>
              <p style={{ color: '#aaa', lineHeight: 1.6 }}>
                Sua beleza é nossa prioridade. Ambiente acolhedor e serviços de alta qualidade realizados por especialistas.
              </p>
              <div className="flex gap-4 mt-6">
                <Instagram className="cursor-pointer hover:text-pink-500 transition" />
                <Facebook className="cursor-pointer hover:text-blue-500 transition" />
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Links Rápidos</h4>
              <nav className="flex flex-col gap-3">
                <a href="#" style={{ color: '#aaa' }} className="hover:text-white transition">Início</a>
                <a href="#servicos" style={{ color: '#aaa' }} className="hover:text-white transition">Nossos Serviços</a>
                <a href="#contato" style={{ color: '#aaa' }} className="hover:text-white transition">Agendamento</a>
              </nav>
            </div>
            <div>
              <h4 className="font-bold mb-6">Informações</h4>
              <div className="flex flex-col gap-4">
                <p className="flex items-center gap-3" style={{ color: '#aaa' }}><MapPin size={18} color="var(--primary)" /> Rua das Flores, 123 - Centro</p>
                <p className="flex items-center gap-3" style={{ color: '#aaa' }}><Phone size={18} color="var(--primary)" /> (73) 99999-9999</p>
                <p className="flex items-center gap-3" style={{ color: '#aaa' }}><Clock size={18} color="var(--primary)" /> Seg - Sáb: 08:00 - 19:00</p>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '30px' }} className="text-center">
            <p style={{ color: '#666', fontSize: '0.85rem' }}>© 2026 Salão de Beleza Nexus. Desenvolvido com ❤️ para sua beleza.</p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {bookingStatus?.show && (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(10px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card"
              style={{ 
                maxWidth: '400px', 
                width: '100%', 
                textAlign: 'center', 
                padding: '40px',
                border: 'none',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            >
              {bookingStatus.type === 'success' ? (
                <>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: '#dcfce7', 
                    color: '#22c55e', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px'
                  }}>
                    <CheckCircle size={48} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-2xl mb-4" style={{ color: '#16a34a' }}>Agendado com Sucesso!</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Recebemos seu pedido. Agora, por favor, <strong>aguarde nossa confirmação personalizada</strong> via WhatsApp para garantir seu horário.
                  </p>
                  <button 
                    onClick={() => setBookingStatus(null)}
                    className="btn btn-primary w-full"
                    style={{ padding: '16px', fontWeight: 700, background: '#22c55e', border: 'none' }}
                  >
                    Entendido, vou aguardar!
                  </button>
                </>
              ) : (
                <>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: '#fee2e2', 
                    color: '#ef4444', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px'
                  }}>
                    <XCircle size={48} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-2xl mb-4" style={{ color: '#dc2626' }}>Ops! Algo deu errado</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Não conseguimos processar seu agendamento. Por favor, tente novamente ou entre em contato pelo telefone.
                  </p>
                  <button 
                    onClick={() => setBookingStatus(null)}
                    className="btn btn-dark w-full"
                    style={{ padding: '16px', fontWeight: 700 }}
                  >
                    Tentar Novamente
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
