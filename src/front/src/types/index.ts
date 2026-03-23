export interface TerritorialOrg {
  id: number;
  name: string;
  sort_order: number;
  institution_count: number;
}

export interface Institution {
  id: number;
  territorial_org_id: number;
  territorial_org_name: string;
  full_name: string;
  short_name: string;
}

export interface ContactInfo {
  address: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
}

export interface PersonnelMember {
  position: string;
  full_name: string;
  work_phone: string;
  mobile_phone: string;
  sort_order: number;
}

export interface ProgramItem {
  code: string;
  specialty_name: string;
  program_type: 'specialty' | 'profession';
  fulltime: boolean;
  parttime: boolean;
  distance: boolean;
  sort_order: number;
}

export interface InstitutionDetail extends Institution {
  contacts: ContactInfo;
  personnel: PersonnelMember[];
  programs: ProgramItem[];
}

export interface SearchResult {
  institution_id: number;
  institution_short_name: string;
  territorial_org_name: string;
  matched_text: string;
}
