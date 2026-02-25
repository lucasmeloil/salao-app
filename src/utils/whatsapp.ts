export const sendWhatsAppConfirmation = (
  clientName: string, 
  service: string, 
  date: string, 
  time: string,
  clientPhone: string,
  total?: string
) => {
  // Normaliza o número: remove tudo que não for dígito e adiciona DDI do Brasil
  const cleanPhone = clientPhone.replace(/\D/g, '');
  const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  const totalLine = total ? `\n💰 *Valor Total: ${total}*` : '';
  const message = `Olá *${clientName}*! ✂️\n\nSeu agendamento no *Salão Nexus* foi confirmado!\n\n📋 *Serviços:* ${service}${totalLine}\n📅 *Data:* ${date}\n⏰ *Horário:* ${time}\n\nEstamos ansiosas para atendê-la! 🌸`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneWithDDI}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

