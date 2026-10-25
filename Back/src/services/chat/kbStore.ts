/**
 * KB 캐시 — Supabase에서 교수·과사·FAQ·용어를 읽고,
 * 실패/빈 테이블이면 로컬 시드(fallback) 유지.
 */
import supabase from '../../config/supabase'
import { DEPARTMENT_OFFICES, type DepartmentOffice, setDepartmentOffices } from '../../data/departmentOffices'
import { FAQ_SEEDS, GLOSSARY, type FaqSeed, setFaqSeeds, setGlossary } from '../../data/faqSeeds'
import { PROFESSORS, type Professor, setProfessors } from '../../data/professors'

type KbSnapshot = {
  professors: Professor[]
  offices: DepartmentOffice[]
  faqs: FaqSeed[]
  glossary: { term: string; official: string }[]
  source: 'db' | 'seed'
  loadedAt: number
}

let snapshot: KbSnapshot = {
  professors: PROFESSORS,
  offices: DEPARTMENT_OFFICES,
  faqs: FAQ_SEEDS,
  glossary: GLOSSARY,
  source: 'seed',
  loadedAt: 0,
}

let loading: Promise<KbSnapshot> | null = null
const TTL_MS = 5 * 60 * 1000

export function getKbSnapshot() {
  return snapshot
}

export async function ensureKbLoaded(force = false): Promise<KbSnapshot> {
  if (!force && snapshot.loadedAt && Date.now() - snapshot.loadedAt < TTL_MS) {
    return snapshot
  }
  if (loading) return loading
  loading = (async () => {
    try {
      const [profRes, officeRes, faqRes, glossRes] = await Promise.all([
        supabase.from('professors').select('name, aliases, department, phone, email, source_url'),
        supabase.from('department_offices').select('department, aliases, building, room, phones, source_url, review_note'),
        supabase.from('kb_faq').select('*'),
        supabase.from('kb_glossary').select('term, official'),
      ])

      const professors = (profRes.data || []).map((r: any) => ({
        name: r.name,
        aliases: r.aliases || [],
        department: r.department,
        phone: r.phone,
        email: r.email,
        source_url: r.source_url,
      })) as Professor[]

      const offices = (officeRes.data || []).map((r: any) => ({
        department: r.department,
        aliases: r.aliases || [],
        building: r.building,
        room: r.room,
        phones: r.phones || [],
        source_url: r.source_url,
        review_note: r.review_note || undefined,
      })) as DepartmentOffice[]

      const faqs = (faqRes.data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        keywords: r.keywords || [],
        required_any: Array.isArray(r.required_any) ? r.required_any : [],
        slots: r.slots || [],
        answer_template: r.answer_template,
        source_url: r.source_url,
        priority: r.priority ?? 0,
        academic_year: r.academic_year ?? undefined,
        review_note: r.review_note || undefined,
      })) as FaqSeed[]

      const glossary = (glossRes.data || []).map((r: any) => ({
        term: r.term,
        official: r.official,
      }))

      const usedDb = professors.length > 0 || offices.length > 0 || faqs.length > 0
      if (professors.length) setProfessors(professors)
      if (offices.length) setDepartmentOffices(offices)
      if (faqs.length) setFaqSeeds(faqs)
      if (glossary.length) setGlossary(glossary)

      snapshot = {
        professors: professors.length ? professors : PROFESSORS,
        offices: offices.length ? offices : DEPARTMENT_OFFICES,
        faqs: faqs.length ? faqs : FAQ_SEEDS,
        glossary: glossary.length ? glossary : GLOSSARY,
        source: usedDb ? 'db' : 'seed',
        loadedAt: Date.now(),
      }
      if (profRes.error || officeRes.error || faqRes.error || glossRes.error) {
        console.warn('[kbStore] partial DB error, using mix/seed', {
          professors: profRes.error?.message,
          offices: officeRes.error?.message,
          faqs: faqRes.error?.message,
          glossary: glossRes.error?.message,
        })
      }
    } catch (err: any) {
      console.warn('[kbStore] load failed, seed fallback:', err?.message || err)
      snapshot = {
        professors: PROFESSORS,
        offices: DEPARTMENT_OFFICES,
        faqs: FAQ_SEEDS,
        glossary: GLOSSARY,
        source: 'seed',
        loadedAt: Date.now(),
      }
    } finally {
      loading = null
    }
    return snapshot
  })()
  return loading
}
