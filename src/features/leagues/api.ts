import { apiClient, publicApiClient } from "@/lib/api/client";

export type League = {
  id: string;
  ownerId: string;
  viewerRole?: "owner" | "admin" | "scorer";
  name: string;
  slug: string;
  sport: "cricket";
  location: string | null;
  createdAt: string;
};
export type Tournament = {
  id: string;
  leagueId: string;
  name: string;
  season: string;
  status: "draft" | "open" | "live" | "completed" | "archived";
  timezone: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};
export type Page<T> = { data: T[]; page: number; pageSize: number };
export type LeagueInput = { name: string; location?: string };
export type TournamentInput = {
  name: string;
  season: string;
  timezone?: string;
};
export type Match = {
  id: string;
  matchNumber: number;
  date: string;
  venue: string;
  status: "upcoming" | "locked" | "live" | "completed" | "cancelled";
  team1: { name: string; code: string; logo: string };
  team2: { name: string; code: string; logo: string };
};

export const leagueApi = {
  async list(page: number, signal?: AbortSignal) {
    return (
      await apiClient.get<Page<League>>("/leagues", {
        params: { page },
        signal,
      })
    ).data;
  },
  async save(input: LeagueInput, id?: string) {
    const body = {
      name: input.name.trim(),
      location: input.location?.trim() || "",
    };
    return (
      id
        ? await apiClient.patch<League>(`/leagues/${id}`, body)
        : await apiClient.post<League>("/leagues", body)
    ).data;
  },
  async tournaments(leagueId: string, page: number, signal?: AbortSignal) {
    return (
      await apiClient.get<Page<Tournament>>(
        `/leagues/${leagueId}/tournaments`,
        { params: { page }, signal },
      )
    ).data;
  },
  async saveTournament(leagueId: string, input: TournamentInput, id?: string) {
    const body = {
      name: input.name.trim(),
      season: input.season.trim(),
      ...(input.timezone ? { timezone: input.timezone } : {}),
    };
    const path = `/leagues/${leagueId}/tournaments`;
    return (
      id
        ? await apiClient.patch<Tournament>(`${path}/${id}`, body)
        : await apiClient.post<Tournament>(path, body)
    ).data;
  },
  async matches(signal?: AbortSignal) {
    return (
      await publicApiClient.get<{ success: true; data: Match[] }>("/matches", {
        signal,
      })
    ).data.data;
  },
};
