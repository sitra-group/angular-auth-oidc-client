export interface LoginResponse {
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  nonce?: string,
  configId?: string;
  errorMessage?: string;
}
