from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str


class ChangePasswordRequest(BaseModel):
    role: str
    new_password: str


# ── Territorial organisations ─────────────────────────────────────────────────

class TerritorialOrgCreate(BaseModel):
    name: str
    sort_order: int = 0


class TerritorialOrgResponse(BaseModel):
    id: int
    name: str
    sort_order: int
    institution_count: int = 0


# ── Institutions ──────────────────────────────────────────────────────────────

class InstitutionCreate(BaseModel):
    territorial_org_id: int
    full_name: str
    short_name: str


class InstitutionResponse(BaseModel):
    id: int
    territorial_org_id: int
    territorial_org_name: str
    full_name: str
    short_name: str


# ── Contacts ──────────────────────────────────────────────────────────────────

class ContactInfo(BaseModel):
    address: str = ""
    phone: str = ""
    fax: str = ""
    email: str = ""
    website: str = ""


# ── Personnel ─────────────────────────────────────────────────────────────────

class PersonnelMember(BaseModel):
    position: str
    full_name: str
    work_phone: str = ""
    mobile_phone: str = ""
    sort_order: int = 0


# ── Programs ──────────────────────────────────────────────────────────────────

class ProgramItem(BaseModel):
    code: str
    specialty_name: str
    program_type: str = "specialty"
    fulltime: bool = False
    parttime: bool = False
    distance: bool = False
    sort_order: int = 0


# ── Institution detail (aggregated) ──────────────────────────────────────────

class InstitutionDetail(BaseModel):
    id: int
    territorial_org_id: int
    territorial_org_name: str
    full_name: str
    short_name: str
    contacts: ContactInfo
    personnel: list[PersonnelMember]
    programs: list[ProgramItem]


# ── Search ────────────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    institution_id: int
    institution_short_name: str
    territorial_org_name: str
    matched_text: str
