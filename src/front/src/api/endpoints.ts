import { apiRequest } from './client';
import type {
  TerritorialOrg,
  Institution,
  InstitutionDetail,
  ContactInfo,
  PersonnelMember,
  ProgramItem,
  SearchResult,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export function login(
  password: string,
): Promise<{ token: string; role: string }> {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function changePassword(
  role: string,
  newPassword: string,
): Promise<void> {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ role, new_password: newPassword }),
  });
}

// ── Territorial Organisations ─────────────────────────────────────────────────

export function getTerritorialOrgs(): Promise<TerritorialOrg[]> {
  return apiRequest('/api/territorial-orgs');
}

export function createTerritorialOrg(data: {
  name: string;
  sort_order: number;
}): Promise<TerritorialOrg> {
  return apiRequest('/api/territorial-orgs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTerritorialOrg(
  id: number,
  data: { name: string; sort_order: number },
): Promise<TerritorialOrg> {
  return apiRequest(`/api/territorial-orgs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteTerritorialOrg(id: number): Promise<void> {
  return apiRequest(`/api/territorial-orgs/${id}`, {
    method: 'DELETE',
  });
}

// ── Institutions ──────────────────────────────────────────────────────────────

export function getInstitutions(
  toId?: number,
  q?: string,
): Promise<Institution[]> {
  const params = new URLSearchParams();
  if (toId !== undefined) params.set('to_id', String(toId));
  if (q) params.set('q', q);
  const qs = params.toString();
  return apiRequest(`/api/institutions${qs ? `?${qs}` : ''}`);
}

export function getInstitution(id: number): Promise<InstitutionDetail> {
  return apiRequest(`/api/institutions/${id}`);
}

export function createInstitution(data: {
  territorial_org_id: number;
  full_name: string;
  short_name: string;
}): Promise<Institution> {
  return apiRequest('/api/institutions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateInstitution(
  id: number,
  data: {
    territorial_org_id: number;
    full_name: string;
    short_name: string;
  },
): Promise<Institution> {
  return apiRequest(`/api/institutions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteInstitution(id: number): Promise<void> {
  return apiRequest(`/api/institutions/${id}`, {
    method: 'DELETE',
  });
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export function updateContacts(
  institutionId: number,
  data: ContactInfo,
): Promise<void> {
  return apiRequest(`/api/institutions/${institutionId}/contacts`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Personnel ─────────────────────────────────────────────────────────────────

export function updatePersonnel(
  institutionId: number,
  data: PersonnelMember[],
): Promise<void> {
  return apiRequest(`/api/institutions/${institutionId}/personnel`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Programs ──────────────────────────────────────────────────────────────────

export function updatePrograms(
  institutionId: number,
  data: ProgramItem[],
): Promise<void> {
  return apiRequest(`/api/institutions/${institutionId}/programs`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Search ────────────────────────────────────────────────────────────────────

export function search(query: string): Promise<SearchResult[]> {
  return apiRequest(`/api/search?q=${encodeURIComponent(query)}`);
}

// ── Import ────────────────────────────────────────────────────────────────────

export function importArchive(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/api/import/archive', {
    method: 'POST',
    body: formData,
  });
}

export function importRegistry(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/api/import/registry', {
    method: 'POST',
    body: formData,
  });
}
