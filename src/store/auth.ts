import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware';

type Role = 'admin'|'trabajador'|'cliente'
export type User = { id:string; name:string; email:string; role:Role }

type AuthState = {
  token: string|null
  user: User|null
  login: (p:{token:string; user:User}) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: ({token, user}) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth', // clave en localStorage
      storage: createJSONStorage(() => localStorage),
      // opcional: versionado/migraciones si cambias formato
    }
  )
);