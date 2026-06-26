import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ERROR_MAP: Record<string, string> = {
  "a user with this email address has already been registered": "Este email já está cadastrado. Tente fazer login.",
  "user already registered": "Este email já está cadastrado. Tente fazer login.",
  "invalid login credentials": "Email ou senha incorretos.",
  "invalid credentials": "Email ou senha incorretos.",
  "email not confirmed": "Email ainda não confirmado. Verifique sua caixa de entrada.",
  "password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
  "password should be at least 8 characters": "A senha deve ter pelo menos 8 caracteres.",
  "user not found": "Usuário não encontrado.",
  "email already in use": "Este email já está em uso.",
  "signup disabled": "Novos cadastros estão desativados no momento.",
  "email link is invalid or has expired": "O link expirou ou é inválido. Solicite um novo.",
  "token has expired or is invalid": "O link expirou ou é inválido. Solicite um novo.",
  "rate limit exceeded": "Muitas tentativas. Aguarde um momento e tente novamente.",
  "too many requests": "Muitas tentativas. Aguarde um momento e tente novamente.",
  "network error": "Erro de conexão. Verifique sua internet.",
  "failed to fetch": "Erro de conexão. Verifique sua internet.",
};

export function translateError(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, translation] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return translation;
  }
  return message;
}
