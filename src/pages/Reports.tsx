import { useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { BarChart3, TrendingUp, DollarSign, RotateCcw, Trash2, FileText } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('month'); 
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [confirmModal, setConfirmModal] = useState<{show: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'info'}>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const { addNotification } = useNotifications();

  const handleRefund = async (sale: any) => {
    setConfirmModal({
      show: true,
      title: 'Estornar Venda',
      message: `Deseja realmente estornar a venda de R$ ${Number(sale.final_value).toFixed(2)}? O agendamento vinculado voltará ao status 'Confirmado'.`,
      type: 'info',
      onConfirm: async () => {
        try {
          // 1. Delete from services_finalized
          const { error: saleError } = await supabase.from('services_finalized').delete().eq('id', sale.id);
          if (saleError) throw saleError;

          // 2. Revert appointment status if agendamento_id exists
          if (sale.agendamento_id) {
            await supabase.from('agendamentos').update({ status: 'confirmed' }).eq('id', sale.agendamento_id);
          }

          addNotification('Venda Estornada', 'A movimentação financeira foi removida e o agendamento reaberto.', 'info');
          fetchSales();
        } catch (error) {
          console.error("Erro ao estornar:", error);
          addNotification('Erro', 'Não foi possível processar o estorno.', 'error');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  useEffect(() => {
    fetchCollaborators();
    fetchSales();
  }, [filterType, selectedCollabId]);

  const fetchCollaborators = async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setCollaborators(data);
  };

  const fetchSales = async (currentStart?: string, currentEnd?: string) => {
    setLoading(true);
    let query = supabase
      .from('services_finalized')
      .select('*, users(name)');

    const start = currentStart || startDate;
    const end = currentEnd || endDate;

    if (filterType === 'month') {
      const d = new Date();
      const first = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const last = new Date().toISOString().split('T')[0];
      query = query.gte('created_at', first + 'T00:00:00Z').lte('created_at', last + 'T23:59:59Z');
    } else if (filterType === 'last_month') {
      const d = new Date();
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
      const last = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0];
      query = query.gte('created_at', first + 'T00:00:00Z').lte('created_at', last + 'T23:59:59Z');
    } else if (filterType === 'year') {
      const first = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      query = query.gte('created_at', first + 'T00:00:00Z');
    } else if (filterType === 'custom') {
      query = query.gte('created_at', start + 'T00:00:00Z').lte('created_at', end + 'T23:59:59Z');
    }

    if (selectedCollabId !== 'all') {
      query = query.eq('collaborator_id', selectedCollabId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  const handleApplyCustomFilter = () => {
    fetchSales();
  };

  const calculateTotal = () => reports.reduce((acc, r) => acc + Number(r.final_value), 0);
  
  const calculateCommission = () => {
    return reports.reduce((acc, r) => {
      // Usar a taxa de comissão do colaborador se disponível, senão padrão 50%
      const rate = r.users?.commission_rate || 50;
      // Se tiver service_value gravado (novos registros), usa ele. 
      // Senão, usa o valor final (compatibilidade com registros antigos)
      const baseValue = (r.service_value && Number(r.service_value) > 0) ? Number(r.service_value) : Number(r.final_value);
      return acc + (baseValue * (rate / 100));
    }, 0);
  };
  
  const calculateProfit = () => calculateTotal() - calculateCommission();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Relatorio de Vendas", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Gerado em: ${today}`, 14, 28);
      
      // Filter Summary
      const collabName = selectedCollabId === 'all' ? 'Todas Colaboradoras' : collaborators.find(c => String(c.id) === selectedCollabId)?.name || 'N/A';
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`Periodo: ${new Date(startDate).toLocaleDateString()} ate ${new Date(endDate).toLocaleDateString()}`, 14, 38);
      doc.text(`Colaboradora: ${collabName}`, 14, 44);

      // Financial Cards
      autoTable(doc, {
        startY: 52,
        head: [['Resumo Financeiro', 'Valor']],
        body: [
          ['Faturamento Total', `R$ ${calculateTotal().toFixed(2)}`],
          ['Total Comissoes', `R$ ${calculateCommission().toFixed(2)}`],
          ['Lucro Liquido', `R$ ${calculateProfit().toFixed(2)}`],
          ['Quantidade de Servicos', reports.length.toString()],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });

      // Sales Table
      const tableData = reports.map(r => [
        new Date(r.created_at).toLocaleDateString(),
        r.users?.name || '-',
        r.payment_method?.toUpperCase() || '-',
        `R$ ${Number(r.total_value).toFixed(2)}`,
        `R$ ${Number(r.discount_value).toFixed(2)}`,
        `R$ ${Number(r.final_value).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Data', 'Profissional', 'PGTO', 'Valor Base', 'Desconto', 'Valor Final']],
        body: tableData,
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 9 }
      });

      doc.save(`relatorio_vendas_${startDate}_${endDate}.pdf`);
      addNotification('Sucesso', 'PDF gerado com sucesso!', 'success');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      addNotification('Erro', 'Nao foi possivel gerar o PDF.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Relatórios de Vendas</h2>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex gap-2 items-center">
            <select 
              value={selectedCollabId} 
              onChange={(e) => setSelectedCollabId(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1.5px solid var(--gray-200)', minWidth: '150px' }}
            >
              <option value="all">Todas Colaboradoras</option>
              {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1.5px solid var(--gray-200)', minWidth: '150px' }}
            >
              <option value="month">Este Mês</option>
              <option value="last_month">Mês Passado</option>
              <option value="year">Este Ano</option>
              <option value="custom">Período Personalizado</option>
            </select>
          </div>

          {filterType === 'custom' && (
            <div className="flex gap-2 items-center">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid var(--gray-200)' }}
              />
              <span className="text-gray-400 font-bold">até</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid var(--gray-200)' }}
              />
              <button 
                onClick={handleApplyCustomFilter}
                className="btn btn-primary"
                style={{ padding: '10px 20px' }}
              >
                Filtrar
              </button>
            </div>
          )}
          
          <button 
            onClick={handleExportPDF}
            className="btn btn-dark flex items-center gap-2"
          >
            <FileText size={18} /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Faturamento Total', value: `R$ ${calculateTotal().toFixed(2)}`, icon: <DollarSign color="#16a34a" /> },
          { label: 'Comissão (Equipe)', value: `R$ ${calculateCommission().toFixed(2)}`, icon: <RotateCcw color="#2563eb" /> },
          { label: 'Lucro Líquido', value: `R$ ${calculateProfit().toFixed(2)}`, icon: <TrendingUp color="#16a34a" /> },
          { label: 'Serviços Realizados', value: reports.length.toString(), icon: <BarChart3 color="#9333ea" /> },
        ].map((stat, i) => (
          <div key={i} className="card flex flex-col gap-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', width: 'fit-content' }}>{stat.icon}</div>
              {stat.label === 'Lucro Líquido' && (
                <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-tighter">
                  {((calculateProfit() / (calculateTotal() || 1)) * 100).toFixed(0)}% de Margem
                </span>
              )}
            </div>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{stat.label}</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-bold mb-6">Histórico de Vendas Recentas</h3>
        
        {/* Desktop View Table */}
        <div className="hidden-mobile overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                <th className="p-4">Data</th>
                <th className="p-4">Profissional</th>
                <th className="p-4">Pagamento</th>
                <th className="p-4">Valor Base</th>
                <th className="p-4">Desconto</th>
                <th className="p-4">Valor Final</th>
                <th className="p-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                    Carregando movimentações...
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td className="p-4">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-medium">{r.users?.name || '-'}</td>
                    <td className="p-4 uppercase text-xs font-bold" style={{ color: '#64748b' }}>{r.payment_method || '-'}</td>
                    <td className="p-4">R$ {Number(r.total_value).toFixed(2)}</td>
                    <td className="p-4" style={{ color: '#dc2626' }}>- R$ {Number(r.discount_value).toFixed(2)}</td>
                    <td className="p-4 font-bold">R$ {Number(r.final_value).toFixed(2)}</td>
                    <td className="p-4">
                       <button 
                         onClick={() => handleRefund(r)}
                         className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 flex items-center gap-1 font-bold text-xs"
                       >
                         <RotateCcw size={14} /> Estornar
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                    Nenhuma venda encontrada para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="mobile-only flex flex-col gap-4">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : reports.length > 0 ? (
            reports.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-gray-100 flex flex-col gap-2" style={{ background: '#f8fafc' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                  <span className="badge uppercase text-xs font-bold" style={{ background: '#fff' }}>{r.payment_method || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{r.users?.name || 'Profissional'}</span>
                  <span className="font-bold text-lg">R$ {Number(r.final_value).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                  <div className="flex gap-2">
                     <span>Base: R$ {Number(r.total_value).toFixed(2)}</span>
                     <span className="text-red-500">Desc: -R$ {Number(r.discount_value).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => handleRefund(r)}
                    className="bg-orange-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    Estornar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">Nenhuma venda no período.</div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div className="card w-full animate-scale" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: confirmModal.type === 'danger' ? '#fee2e2' : '#f0f9ff', 
              color: confirmModal.type === 'danger' ? '#dc2626' : '#0369a1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              {confirmModal.type === 'danger' ? <Trash2 size={30} /> : <RotateCcw size={30} />}
            </div>
            <h3 className="font-bold text-xl mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                className="btn w-full" 
                style={{ background: '#f1f5f9', color: '#64748b' }} 
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              >
                Cancelar
              </button>
              <button 
                className="btn w-full text-white" 
                style={{ background: confirmModal.type === 'danger' ? '#dc2626' : '#0369a1', fontWeight: 700 }} 
                onClick={confirmModal.onConfirm}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
