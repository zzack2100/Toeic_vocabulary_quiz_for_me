interface AuthResponse {
  token?: string
  id?: string
  email?: string
  error?: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = (await response.json()) as AuthResponse

  if (!response.ok) {
    throw new Error(data.error ?? 'Login failed.')
  }

  return data
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = (await response.json()) as AuthResponse

  if (!response.ok) {
    throw new Error(data.error ?? 'Registration failed.')
  }

  return data
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })

  const data = (await response.json()) as AuthResponse

  if (!response.ok) {
    throw new Error(data.error ?? 'Google login failed.')
  }

  return data
}
