/**
 * Tipos de la base de datos de Growwly.
 *
 * Escritos a mano por ahora, siguiendo el formato que genera
 * `supabase gen types typescript`. Cuando el proyecto esté enlazado
 * a Supabase (con credenciales reales), se puede regenerar este
 * archivo automáticamente con:
 *
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          descripcion: string | null;
          comunidad_autonoma: string | null;
          provincia: string | null;
          ciudad: string | null;
          zona: string | null;
          lat: number | null;
          lng: number | null;
          telefono: string | null;
          email: string | null;
          web: string | null;
          redes_sociales: Json;
          tecnicas: string[];
          idiomas: string[];
          financiacion: boolean;
          primera_consulta_gratis: boolean;
          fotos: string[];
          verificado: boolean;
          direccion: string | null;
          rango_precios: string | null;
          accesibilidad: string | null;
          horarios: string | null;
          rating_google: number | null;
          resenas_google: number | null;
          rating_doctoralia: number | null;
          resenas_doctoralia: number | null;
          tipo_negocio: string | null;
          servicios_adicionales: string[];
          tiene_oferta: boolean;
          detalle_oferta: string | null;
          destacado: boolean;
          orden: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nombre: string;
          descripcion?: string | null;
          comunidad_autonoma?: string | null;
          provincia?: string | null;
          ciudad?: string | null;
          zona?: string | null;
          lat?: number | null;
          lng?: number | null;
          telefono?: string | null;
          email?: string | null;
          web?: string | null;
          redes_sociales?: Json;
          tecnicas?: string[];
          idiomas?: string[];
          financiacion?: boolean;
          primera_consulta_gratis?: boolean;
          fotos?: string[];
          verificado?: boolean;
          direccion?: string | null;
          rango_precios?: string | null;
          accesibilidad?: string | null;
          horarios?: string | null;
          rating_google?: number | null;
          resenas_google?: number | null;
          rating_doctoralia?: number | null;
          resenas_doctoralia?: number | null;
          tipo_negocio?: string | null;
          servicios_adicionales?: string[];
          tiene_oferta?: boolean;
          detalle_oferta?: string | null;
          destacado?: boolean;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nombre?: string;
          descripcion?: string | null;
          comunidad_autonoma?: string | null;
          provincia?: string | null;
          ciudad?: string | null;
          zona?: string | null;
          lat?: number | null;
          lng?: number | null;
          telefono?: string | null;
          email?: string | null;
          web?: string | null;
          redes_sociales?: Json;
          tecnicas?: string[];
          idiomas?: string[];
          financiacion?: boolean;
          primera_consulta_gratis?: boolean;
          fotos?: string[];
          verificado?: boolean;
          direccion?: string | null;
          rango_precios?: string | null;
          accesibilidad?: string | null;
          horarios?: string | null;
          rating_google?: number | null;
          resenas_google?: number | null;
          rating_doctoralia?: number | null;
          resenas_doctoralia?: number | null;
          tipo_negocio?: string | null;
          servicios_adicionales?: string[];
          tiene_oferta?: boolean;
          detalle_oferta?: string | null;
          destacado?: boolean;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          nombre: string | null;
          apellidos: string | null;
          telefono: string | null;
          edad: number | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          nombre?: string | null;
          apellidos?: string | null;
          telefono?: string | null;
          edad?: number | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          nombre?: string | null;
          apellidos?: string | null;
          telefono?: string | null;
          edad?: number | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      estudios_capilares: {
        Row: {
          id: string;
          user_id: string;
          foto_frontal: string | null;
          foto_donante: string | null;
          foto_coronilla: string | null;
          foto_perfil_derecho: string | null;
          foto_perfil_izquierdo: string | null;
          resultado_texto: string | null;
          norwood_estimado: string | null;
          es_alopecia_tratable: boolean | null;
          estado: string;
          fotos_adicionales: string[];
          error_detalle: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          foto_frontal?: string | null;
          foto_donante?: string | null;
          foto_coronilla?: string | null;
          foto_perfil_derecho?: string | null;
          foto_perfil_izquierdo?: string | null;
          resultado_texto?: string | null;
          norwood_estimado?: string | null;
          es_alopecia_tratable?: boolean | null;
          estado?: string;
          fotos_adicionales?: string[];
          error_detalle?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          foto_frontal?: string | null;
          foto_donante?: string | null;
          foto_coronilla?: string | null;
          foto_perfil_derecho?: string | null;
          foto_perfil_izquierdo?: string | null;
          resultado_texto?: string | null;
          norwood_estimado?: string | null;
          es_alopecia_tratable?: boolean | null;
          estado?: string;
          fotos_adicionales?: string[];
          error_detalle?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type EstudioCapilar =
  Database["public"]["Tables"]["estudios_capilares"]["Row"];
