import { supabase } from "./ts/supabase";

/**
 * Cria um agendamento no banco de dados
 */
export async function createAppointment(cliente: string, servico: string, data: string, hora: string, colaboradorId: string) {
  const { data: appointment, error } = await supabase
    .from("agendamentos")
    .insert([
      {
        client_name: cliente,
        service: servico,
        date: data,
        time: hora,
        collaborator_id: colaboradorId,
        confirmed_whatsapp: false
      }
    ]);

  if (error) {
    console.error("Erro ao criar agendamento:", error);
    return { success: false, error };
  } else {
    console.log("Agendamento criado:", appointment);
    return { success: true, appointment };
  }
}

/**
 * Insere o usuário administrador inicial
 */
export async function seedAdminUser() {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email: "salao@nexus.com",
        password: "salao102030",
        role: "admin",
        name: "Administrador Nexus"
      }
    ]);

  if (error) {
    if (error.code === '23505') {
       console.log("Admin já existe.");
       return { success: true, message: "Admin já existe" };
    }
    console.error("Erro ao inserir admin:", error);
    return { success: false, error };
  } else {
    console.log("Admin criado:", data);
    return { success: true, data };
  }
}
