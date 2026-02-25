export const sendWhatsAppConfirmation = (clientName: string, service: string, date: string, time: string) => {
  const message = `Olá ${clientName}! Seu agendamento para *${service}* no Salão Nexus está confirmado para o dia ${date} às ${time}. Estamos ansiosas para atendê-la!`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/5511999999999?text=${encodedMessage}`; // Replace with actual business number
  window.open(whatsappUrl, '_blank');
};
