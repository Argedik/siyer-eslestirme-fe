/**
 * API Client - Temel HTTP İstek Yöneticisi
 * 
 * SOLID PRENSİPLERİ:
 * - S (Single Responsibility): Sadece HTTP isteklerini yönetir
 * - O (Open/Closed): Yeni endpoint'ler eklenebilir, mevcut kod değişmez
 * 
 * BACKEND REFERANS:
 * - appsettings.json → API base URL
 * - [Route("api/[controller]")] → URL formatı
 */

// Environment variable'dan API URL'i al, yoksa varsayılan kullan
// Production: https://api.argedik.com
// Development: http://localhost:8080 veya http://78.180.182.197:8080
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.argedik.com';

/**
 * API Hata Sınıfı
 * HTTP hatalarını yönetir
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * HTTP İstek Seçenekleri
 */
interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Temel API İstek Fonksiyonu
 * 
 * @param endpoint - API endpoint'i (örn: "/api/lobby/create")
 * @param options - Fetch seçenekleri (method, body, headers, vb.)
 * @returns Promise<T> - API yanıtı
 * @throws ApiError - HTTP hata durumunda
 * 
 * KULLANIM:
 * const result = await fetchApi<LobbyResponse>('/api/lobby/create', {
 *   method: 'POST',
 *   body: { adminUsername: 'Admin' }
 * });
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, headers, ...restOptions } = options;

  // Tam URL oluştur
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      // Body varsa JSON'a çevir
      body: body ? JSON.stringify(body) : undefined,
    });

    // Hata durumu kontrolü
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      throw new ApiError(
        (errorData as { error?: string; message?: string })?.error ||
        (errorData as { error?: string; message?: string })?.message ||
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // JSON yanıtı parse et
    const data = await response.json();
    return data as T;
  } catch (error) {
    // ApiError ise direkt fırlat
    if (error instanceof ApiError) {
      throw error;
    }

    // Network hatası
    throw new ApiError(
      `Ağ hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      0,
      error
    );
  }
}

/**
 * Health Check - Backend bağlantı kontrolü
 * 
 * BACKEND REFERANS:
 * - GET /health → { status: "ok", message: "API çalışıyor", time: "..." }
 */
export interface HealthCheckResponse {
  status: string;
  message: string;
  time: string;
}

export async function healthCheck(): Promise<HealthCheckResponse> {
  return fetchApi<HealthCheckResponse>('/health', {
    method: 'GET',
  });
}

