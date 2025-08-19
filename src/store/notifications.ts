import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type BookingNotifKind = 'created' | 'updated' | 'deleted'
export type BookingNotif = {
  id: string
  kind: BookingNotifKind
  bookingId: string
  title?: string
  startAt?: string
  endAt?: string
  venueId?: string
  at: number
  read: boolean
}

type NotifState = {
  items: BookingNotif[]
  push: (n: Omit<BookingNotif, 'id' | 'at' | 'read'>) => BookingNotif
  markAllRead: () => void
  clear: () => void
  remove: (id: string) => void
}

const MAX_ITEMS = 50

export const useNotifications = create<NotifState>()(
  persist(
    (set, get) => ({
      items: [],
      push: (n) => {
        const item: BookingNotif = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          at: Date.now(),
          read: false,
          ...n,
        }
        const next = [item, ...get().items].slice(0, MAX_ITEMS)
        set({ items: next })
        return item
      },
      markAllRead: () =>
        set({ items: get().items.map((i) => ({ ...i, read: true })) }),
      clear: () => set({ items: [] }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    }),
    {
      name: 'notif', // clave en localStorage
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Guarda solo los datos, no las funciones
      partialize: (state) => ({ items: state.items }),
      // Limpieza / migraciones si cambias el formato en el futuro
      migrate: (persisted, version) => {
        if (!persisted) return { items: [] }
        // ejemplo: purgar notificaciones muy antiguas (> 30 días)
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
        const now = Date.now()
        const items = Array.isArray((persisted as any).items)
          ? (persisted as any).items.filter(
              (i: BookingNotif) => now - (i?.at ?? now) < THIRTY_DAYS,
            )
          : []
        return { items }
      },
    },
  ),
)
