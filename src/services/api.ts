import { User, Item, AuditLog, SystemStats, ApiEndpointSpec } from '../types/index.js';

const TOKEN_KEY = 'nexus_auth_token';
const USER_KEY = 'nexus_auth_user';

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch {
        this.currentUser = null;
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setSession(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: Request failed`);
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  public async login(credentials: { email: string; password: string }) {
    const data = await this.request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setSession(data.token, data.user);
    return data;
  }

  public async register(payload: { email: string; username: string; fullName: string; password: string }) {
    const data = await this.request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setSession(data.token, data.user);
    return data;
  }

  public async getMe(): Promise<User> {
    const data = await this.request<{ user: User }>('/api/auth/me');
    this.currentUser = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  public async updateProfile(payload: { fullName?: string; bio?: string; avatar?: string }): Promise<User> {
    const data = await this.request<{ message: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    this.currentUser = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  public async changePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // --- Items Endpoints ---
  public async getItems(filters?: { search?: string; category?: string; priority?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ items: Item[]; total: number }>(`/api/items${query}`);
  }

  public async createItem(payload: Partial<Item>) {
    return this.request<{ message: string; item: Item }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateItem(id: string, payload: Partial<Item>) {
    return this.request<{ message: string; item: Item }>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteItem(id: string) {
    return this.request<{ message: string; id: string }>(`/api/items/${id}`, {
      method: 'DELETE',
    });
  }

  public async resetDemoData() {
    return this.request<{ message: string; items: Item[] }>('/api/items/reset-seed', {
      method: 'POST',
    });
  }

  // --- System Endpoints ---
  public async getHealth() {
    return this.request<{
      status: string;
      timestamp: string;
      version: string;
      environment: string;
      database: string;
      uptimeSeconds: number;
      memoryUsageMB: number;
    }>('/api/health');
  }

  public async getStats(): Promise<SystemStats> {
    const data = await this.request<{ stats: SystemStats }>('/api/stats');
    return data.stats;
  }

  public async getLogs(limit = 40): Promise<AuditLog[]> {
    const data = await this.request<{ logs: AuditLog[]; total: number }>(`/api/logs?limit=${limit}`);
    return data.logs;
  }

  public async getApiSpec(): Promise<{
    title: string;
    version: string;
    description: string;
    endpoints: ApiEndpointSpec[];
  }> {
    return this.request('/api/spec');
  }

  // Direct raw execution for the API Playground
  public async executeRawRequest(endpoint: string, method: string, headers: Record<string, string>, body?: string) {
    const startTime = performance.now();
    try {
      const res = await fetch(endpoint, {
        method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body ? body : undefined,
      });
      const durationMs = Math.round(performance.now() - startTime);

      let responseData: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await res.json().catch(() => ({}));
      } else {
        responseData = await res.text();
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      return {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        durationMs,
        headers: resHeaders,
        data: responseData,
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        status: 0,
        statusText: 'Network / Client Error',
        ok: false,
        durationMs,
        headers: {},
        data: { error: err.message || 'Request failed' },
      };
    }
  }
}

export const api = new ApiService();
