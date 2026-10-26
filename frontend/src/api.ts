export type AccountType = "aluno" | "empresa" | "instituicao";

export interface UserSession {
  accessToken: string;
  usuario: { id: number; nome: string; tipo: AccountType };
}

export interface LoginResponse extends UserSession {
  tokenType: "Bearer";
  expiresIn: number;
}

export interface Tag {
  id: number;
  nome: string;
}

export interface Category {
  id: number;
  nome: string;
}

export interface Course {
  id: number;
  nome: string;
}

export interface Institution {
  id: number;
  cnpj: string;
  usuario: { id: number; nome: string; descricao?: string; contato?: string } | string;
}

export interface Vacancy {
  id: number;
  tipo: string;
  descricao?: string | null;
  salario: number | string;
  horarioInicio: string;
  horarioTermino: string;
  numeroDeVagas?: number | null;
  empresa: { id: number; cnpj: string; nome: string } | string;
  tags: Tag[] | string;
}

export interface CurrentUser {
  id: number;
  nome: string;
  email: string;
  descricao?: string | null;
  endereco: string;
  contato?: string | null;
  tipo: AccountType;
  perfil: { id: number; cnpj?: string; ra?: string; periodo?: string } | string;
  curso?: { id: number; nome: string } | string;
  instituicao?: { id: number; nome: string; cnpj: string } | string;
}

export interface StudentResult {
  id: number;
  periodo: string;
  usuario: { id: number; nome: string; descricao?: string } | string;
  curso: { id: number; nome: string } | string;
  instituicao: { id: number; nome: string; cnpj: string } | string;
  tags: Tag[] | string;
}

const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const sessionKey = "skillbridge.session";
const sessionEvent = "skillbridge:session-change";

export function getSession(): UserSession | null {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const session = JSON.parse(storage.getItem(sessionKey) || "null") as UserSession | null;
      if (session?.accessToken) return session;
    } catch {
      storage.removeItem(sessionKey);
    }
  }
  return null;
}

function emitSessionChange() {
  window.dispatchEvent(new Event(sessionEvent));
}

export function subscribeSessionChange(listener: () => void) {
  window.addEventListener(sessionEvent, listener);
  return () => window.removeEventListener(sessionEvent, listener);
}

export function saveSession(response: LoginResponse, remember: boolean) {
  clearSession(false);
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(sessionKey, JSON.stringify({ accessToken: response.accessToken, usuario: response.usuario }));
  emitSessionChange();
}

export function clearSession(notify = true) {
  window.sessionStorage.removeItem(sessionKey);
  window.localStorage.removeItem(sessionKey);
  if (notify) emitSessionChange();
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const session = getSession();
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Não foi possível conectar à API em ${apiBase}. Verifique a URL e se a porta está encaminhada.`);
  }

  const payload = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    if (response.status === 401) clearSession();
    const apiMessage = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    const message = Array.isArray(apiMessage) ? apiMessage.join(" ") : apiMessage;
    throw new Error(message || `A API respondeu com erro ${response.status}.`);
  }
  return payload as T;
}

export function decodeJson<T>(value: T | string): T {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}
