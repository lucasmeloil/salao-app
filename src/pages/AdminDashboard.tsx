import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  CheckSquare, 
  Users, 
  BarChart3, 
  LogOut, 
  Scissors,
  Bell,
  Search,
  User,
  Menu,
  ChevronLeft,
  X,
  UserPlus,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/ts/supabase';
import ManageAppointments from './ManageAppointments';
import StockControl from './StockControl';
import FinalizeService from './FinalizeService';
import Collaborators from './Collaborators';
import Reports from './Reports';
import ManageServices from './ManageServices';
import ManageCustomers from './ManageCustomers';

// Sub-components
const Overview = () => {
  const [stats, setStats] = useState({
    appointmentsCount: 0,
    lowStockCount: 0,
    todaySales: 0,
    nextAppointments: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Fetch Today's Appointments Count
        const { count: appCount } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('date', today);

        // 2. Fetch Next Appointments (All upcoming starting from today, excluding rejected)
        const { data: nextApps } = await supabase
          .from('agendamentos')
          .select('*, cliente(name), users(name)')
          .neq('status', 'rejected')
          .gte('date', today)
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit(10);

        // 3. Fetch Low Stock Items (quantity < 5)
        const { count: lowStock } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lt('quantity', 5);

        // 4. Today's Sales
        const { data: appSales } = await supabase
          .from('services_finalized')
          .select('final_value')
          .gte('created_at', today + 'T00:00:00Z')
          .lte('created_at', today + 'T23:59:59Z');

        const todaySales = appSales?.reduce((acc, sale) => acc + Number(sale.final_value), 0) || 0;

        setStats({
          appointmentsCount: appCount || 0,
          lowStockCount: lowStock || 0,
          todaySales,
          nextAppointments: nextApps || []
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando dados...</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Resumo Geral</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="card flex items-center gap-4 flex-1 md:flex-initial" style={{ padding: '10px 20px' }}>
            <Calendar size={18} color="var(--primary)" />
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Ações Rápidas - Topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Novo Agendamento', 
            desc: 'Agendar cliente',
            href: '/admin/appointments', 
            icon: <Calendar size={22} />,
            bg: 'linear-gradient(135deg, #c9a04e 0%, #b8860b 100%)',
            color: '#fff'
          },
          { 
            label: 'Finalizar', 
            desc: 'Faturar serviço',
            href: '/admin/finalize', 
            icon: <DollarSign size={22} />,
            bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff'
          },
          { 
            label: 'Estoque', 
            desc: 'Entrada de produtos',
            href: '/admin/inventory', 
            icon: <Package size={22} />,
            bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            color: '#0f172a'
          },
          { 
            label: 'Relatórios', 
            desc: 'Visualizar dados',
            href: '/admin/reports', 
            icon: <BarChart3 size={22} />,
            bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            color: '#0f172a'
          },
        ].map((action, i) => (
          <button 
            key={i}
            onClick={() => window.location.href = action.href}
            style={{ 
              background: action.bg, 
              color: action.color, 
              borderRadius: '16px', 
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              border: action.color === '#fff' ? 'none' : '1.5px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: action.color === '#fff' ? '0 4px 15px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = action.color === '#fff' ? '0 4px 15px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ 
              background: action.color === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
              borderRadius: '12px', 
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {action.icon}
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.02em' }}>{action.label}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 500 }}>{action.desc}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { label: 'Agendamentos Hoje', value: stats.appointmentsCount.toString(), icon: <Calendar color="#2563eb" />, trend: 'Real' },
          { label: 'Vendas do Dia', value: `R$ ${stats.todaySales.toFixed(2)}`, icon: <BarChart3 color="#16a34a" />, trend: 'Real' },
          { label: 'Estoque Baixo', value: `${stats.lowStockCount} itens`, icon: <Package color="#dc2626" />, trend: 'Atenção' },
        ].map((stat, i) => (
          <div key={i} className="card flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>{stat.icon}</div>
              <span style={{ fontSize: '0.8rem', color: stat.trend === 'Real' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{stat.trend}</span>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{stat.label}</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Próximos Agendamentos - Full Width */}
      <div className="card">
        <h3 className="font-bold mb-4">Próximos Agendamentos</h3>
        <div className="flex flex-col gap-4">
          {stats.nextAppointments.length > 0 ? stats.nextAppointments.map((app, i) => (
            <div key={i} className="flex justify-between items-center p-4" style={{ background: '#f8fafc', borderRadius: '10px' }}>
              <div className="flex flex-col">
                <span className="font-bold">{app.cliente?.name || app.client_name}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.service} ({app.collaborators?.name || 'Não atribuído'})</span>
                <div className="flex items-center gap-2">
                  <small style={{ color: 'var(--primary)', fontWeight: 600 }}>{new Date(app.date).toLocaleDateString()} às {app.time.slice(0, 5)}</small>
                  <span className={`badge status-${app.status || 'pending'}`} style={{ 
                    fontSize: '0.6rem', 
                    background: app.status === 'finalized' ? '#e0f2fe' : (app.status === 'confirmed' ? '#dcfce7' : '#fef9c3'), 
                    color: app.status === 'finalized' ? '#0369a1' : (app.status === 'confirmed' ? '#16a34a' : '#a16207'),
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {app.status === 'finalized' ? 'FINALIZADO' : (app.status === 'confirmed' ? 'CONFIRMADO' : 'PENDENTE')}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-4 text-center text-gray-400">Nenhum agendamento próximo encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useNotifications } from '../context/NotificationContext';

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const { unreadCount, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (showNotifications) {
      fetchRecentNotifications();
    }
  }, [showNotifications]);

  const fetchRecentNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentNotifs(data || []);
  };

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      setShowNotifications(true);
    } else {
      setShowNotifications(false);
    }
  };

  const handleMarkRead = async () => {
    await markAllAsRead();
    fetchRecentNotifications();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Visão Geral', icon: <LayoutDashboard size={20} />, path: '/admin' },
    { label: 'Agendamentos', icon: <Calendar size={20} />, path: '/admin/appointments' },
    { label: 'Estoque', icon: <Package size={20} />, path: '/admin/inventory' },
    { label: 'Faturar', icon: <CheckSquare size={20} />, path: '/admin/finalize' },
    { label: 'Serviços', icon: <Scissors size={20} />, path: '/admin/services' },
    { label: 'Colaboradores', icon: <Users size={20} />, path: '/admin/collaborators' },
    { label: 'Clientes', icon: <UserPlus size={20} />, path: '/admin/customers' },
    { label: 'Relatórios', icon: <BarChart3 size={20} />, path: '/admin/reports' },
  ];

  return (
    <div className={`dashboard-layout ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="flex items-center justify-between mb-8" style={{ minHeight: '40px' }}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0" style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors color="white" size={20} />
            </div>
            {!isCollapsed && (
              <span className="font-bold logo-text" style={{ fontSize: '1.1rem', color: 'white' }}>ADMIN NEXUS</span>
            )}
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="desktop-menu"
              style={{ background: 'transparent', color: '#64748b', border: 'none', padding: '4px', cursor: 'pointer' }}
            >
              <ChevronLeft style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
            </button>
            <button 
              onClick={() => setIsMobileOpen(false)} 
              className="mobile-menu-btn"
              style={{ background: 'transparent', color: 'white', border: 'none', padding: '4px', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav flex-grow">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              {item.icon}
              <span style={{ fontWeight: 500 }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '20px' }}>
          <div className="nav-item" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair do Sistema</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button 
              className="menu-hamburguer-btn mr-4" 
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setIsMobileOpen(true);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              style={{ background: 'var(--dark)', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex' }}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-4 glass desktop-only" style={{ padding: '8px 16px', borderRadius: '12px', width: '400px' }}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                style={{ border: 'none', background: 'transparent', width: '100%', padding: '4px' }}
              />
            </div>
          </div>
          
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  const audio = new Audio('/sounds/notification.mp3');
                  audio.play();
                }}
                className="btn btn-dark desktop-only"
                style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
              >
                Testar Som
              </button>
              <div style={{ position: 'relative' }}>
                <Bell size={20} color="#64748b" className="cursor-pointer" onClick={handleToggleNotifications} />
              {unreadCount > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  background: '#dc2626', 
                  color: 'white',
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
              
              {showNotifications && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 1000 }} 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="glass" style={{ 
                    position: 'absolute', 
                    top: '40px', 
                    right: '0', 
                    width: '380px', 
                    maxHeight: '480px', 
                    zIndex: 1001, 
                    borderRadius: '16px', 
                    boxShadow: 'var(--shadow-lg)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    overflow: 'hidden'
                  }}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Notificações</span>
                      <button 
                        onClick={handleMarkRead}
                        style={{ background: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                      {recentNotifs.length > 0 ? recentNotifs.map((n) => {
                        const isAppointment = n.title === 'Novo Agendamento!';
                        const totalMatch = n.message.match(/VALOR TOTAL: (R\$ [\d,.]+)/);
                        const total = totalMatch ? totalMatch[1] : null;
                        const phoneMatch = n.message.match(/WHATSAPP: ([\d\s\(\)\-\+]+?)(?:\.|$)/);
                        const clientPhone = phoneMatch ? phoneMatch[1].trim() : null;
                        let cleanMsg = n.message;
                        if (total) cleanMsg = cleanMsg.replace(` VALOR TOTAL: ${totalMatch![0].replace('VALOR TOTAL: ', '')}`, '');
                        if (clientPhone) cleanMsg = cleanMsg.replace(`. WHATSAPP: ${clientPhone}`, '');

                        return (
                          <div key={n.id} style={{ 
                            paddingBottom: '12px', 
                            borderBottom: '1px solid var(--gray-100)',
                            borderLeft: isAppointment ? '3px solid var(--primary)' : '3px solid transparent',
                            paddingLeft: isAppointment ? '8px' : '0'
                          }}>
                            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px', color: isAppointment ? 'var(--primary)' : 'inherit' }}>
                              {n.title}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>{cleanMsg}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {total && (
                                <div style={{ 
                                  background: 'var(--primary)', 
                                  color: 'white',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}>
                                  💰 Total: {total}
                                </div>
                              )}
                              {isAppointment && clientPhone && (
                                <button
                                  onClick={() => {
                                    const cleanPhone = clientPhone.replace(/\D/g, '');
                                    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                                    const text = encodeURIComponent(
                                      `Olá! 😊 Recebemos seu pedido de agendamento no *Salão Nexus* e gostaríamos de confirmar! Em breve entraremos em contato para avisar que seu horarío se aproxima. Obrigada!`
                                    );
                                    window.open(`https://wa.me/${phoneWithDDI}?text=${text}`, '_blank');
                                  }}
                                  style={{
                                    background: '#22c55e',
                                    color: 'white',
                                    borderRadius: '6px',
                                    padding: '3px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  📲 Confirmar via WhatsApp
                                </button>
                              )}
                            </div>
                            <small style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                              {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </div>
                        );
                      }) : (
                        <p className="text-center py-8 text-gray-400" style={{ fontSize: '0.85rem' }}>Nenhuma notificação recente.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden-mobile">
                <span className="font-bold" style={{ fontSize: '0.9rem' }}>{user?.email?.split('@')[0] || 'Usuário'}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Administrador</span>
              </div>
              <div style={{ background: '#e2e8f0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#64748b" />
              </div>
            </div>
          </div>
        </header>



        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/appointments" element={<ManageAppointments />} />
          <Route path="/inventory" element={<StockControl />} />
          <Route path="/finalize" element={<FinalizeService />} />
          <Route path="/collaborators" element={<Collaborators />} />
          <Route path="/services" element={<ManageServices />} />
          <Route path="/customers" element={<ManageCustomers />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
