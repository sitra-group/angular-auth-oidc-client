export interface LoginResponse {
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  nonce?: { value: string, raw: string },
  configId?: string;
  errorMessage?: string;
}
