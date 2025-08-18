import { http } from './http'

export type Overview = {
  range: { from: string; to: string }
  totals: { bookings: number; byVenue: { id: string; name: string; count: number }[] }
  series: { date: string; count: number }[]
}

export async function fetchOverview(params?: { from?: string; to?: string; venueId?: string }) {
  const { data } = await http.get<Overview>('/reports/overview', { params })
  return data
}
