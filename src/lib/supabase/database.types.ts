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
          provincia: string;
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
          precio_desde: number | null;
          precio_hasta: number | null;
          accesibilidad: string | null;
          horarios: string | null;
          logo_url: string | null;
          leads_enabled: boolean;
          medicos: Json;
          video_url: string | null;
          descripcion_extendida: string | null;
          visibilidad_fechas: Json;
          rating_google: number | null;
          resenas_google: number | null;
          rating_doctoralia: number | null;
          resenas_doctoralia: number | null;
          tipo_negocio: string | null;
          servicios_adicionales: string[];
          tiene_oferta: boolean;
          detalle_oferta: string | null;
          destacado: boolean;
          publicado: boolean;
          destacado_solicitado: boolean;
          plan: string;
          plan_solicitado: string | null;
          destacado_home: boolean;
          destacado_home_solicitado: boolean;
          destacado_ciudad: boolean;
          destacado_ciudad_solicitado: boolean;
          horarios_estructurados: Json;
          datos_facturacion: Json;
          fotos_antes_despues: Json;
          opiniones: Json;
          certificados: string[];
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
          provincia?: string;
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
          precio_desde?: number | null;
          precio_hasta?: number | null;
          accesibilidad?: string | null;
          horarios?: string | null;
          logo_url?: string | null;
          leads_enabled?: boolean;
          medicos?: Json;
          video_url?: string | null;
          descripcion_extendida?: string | null;
          visibilidad_fechas?: Json;
          rating_google?: number | null;
          resenas_google?: number | null;
          rating_doctoralia?: number | null;
          resenas_doctoralia?: number | null;
          tipo_negocio?: string | null;
          servicios_adicionales?: string[];
          tiene_oferta?: boolean;
          detalle_oferta?: string | null;
          destacado?: boolean;
          publicado?: boolean;
          destacado_solicitado?: boolean;
          plan?: string;
          plan_solicitado?: string | null;
          destacado_home?: boolean;
          destacado_home_solicitado?: boolean;
          destacado_ciudad?: boolean;
          destacado_ciudad_solicitado?: boolean;
          horarios_estructurados?: Json;
          datos_facturacion?: Json;
          fotos_antes_despues?: Json;
          opiniones?: Json;
          certificados?: string[];
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
          provincia?: string;
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
          precio_desde?: number | null;
          precio_hasta?: number | null;
          accesibilidad?: string | null;
          horarios?: string | null;
          logo_url?: string | null;
          leads_enabled?: boolean;
          medicos?: Json;
          video_url?: string | null;
          descripcion_extendida?: string | null;
          visibilidad_fechas?: Json;
          rating_google?: number | null;
          resenas_google?: number | null;
          rating_doctoralia?: number | null;
          resenas_doctoralia?: number | null;
          tipo_negocio?: string | null;
          servicios_adicionales?: string[];
          tiene_oferta?: boolean;
          detalle_oferta?: string | null;
          destacado?: boolean;
          publicado?: boolean;
          destacado_solicitado?: boolean;
          plan?: string;
          plan_solicitado?: string | null;
          destacado_home?: boolean;
          destacado_home_solicitado?: boolean;
          destacado_ciudad?: boolean;
          destacado_ciudad_solicitado?: boolean;
          horarios_estructurados?: Json;
          datos_facturacion?: Json;
          fotos_antes_despues?: Json;
          opiniones?: Json;
          certificados?: string[];
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
          clinic_id: string | null;
          clinic_status: string | null;
          fecha_nacimiento: string | null;
          ciudad: string | null;
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
          clinic_id?: string | null;
          clinic_status?: string | null;
          fecha_nacimiento?: string | null;
          ciudad?: string | null;
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
          clinic_id?: string | null;
          clinic_status?: string | null;
          fecha_nacimiento?: string | null;
          ciudad?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      municipios: {
        Row: {
          id: string;
          provincia: string;
          nombre: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          provincia: string;
          nombre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          provincia?: string;
          nombre?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      zonas: {
        Row: {
          id: string;
          municipio: string;
          nombre: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          municipio: string;
          nombre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          municipio?: string;
          nombre?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      clinic_members: {
        Row: {
          id: string;
          profile_id: string;
          clinic_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          clinic_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          clinic_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      estudios_capilares: {
        Row: {
          id: string;
          user_id: string | null;
          claim_token: string;
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
          user_id?: string | null;
          claim_token?: string;
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
          user_id?: string | null;
          claim_token?: string;
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
      solicitudes_presupuesto: {
        Row: {
          id: string;
          user_id: string;
          estudio_id: string | null;
          ciudad: string | null;
          progresion_perdida: string | null;
          antecedentes_familiares: string | null;
          medicacion_actual: string | null;
          tratamientos_interes: string[];
          dejar_decidir_medico: boolean;
          cuando_tratamiento: string | null;
          donde_tratamiento: string | null;
          presupuesto_rango: string | null;
          consentimiento_datos_en: string | null;
          consentimiento_compartir_en: string | null;
          estado: string;
          clinicas_notificadas: number | null;
          notificacion_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          estudio_id?: string | null;
          ciudad?: string | null;
          progresion_perdida?: string | null;
          antecedentes_familiares?: string | null;
          medicacion_actual?: string | null;
          tratamientos_interes?: string[];
          dejar_decidir_medico?: boolean;
          cuando_tratamiento?: string | null;
          donde_tratamiento?: string | null;
          presupuesto_rango?: string | null;
          consentimiento_datos_en?: string | null;
          consentimiento_compartir_en?: string | null;
          estado?: string;
          clinicas_notificadas?: number | null;
          notificacion_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          estudio_id?: string | null;
          ciudad?: string | null;
          progresion_perdida?: string | null;
          antecedentes_familiares?: string | null;
          medicacion_actual?: string | null;
          tratamientos_interes?: string[];
          dejar_decidir_medico?: boolean;
          cuando_tratamiento?: string | null;
          donde_tratamiento?: string | null;
          presupuesto_rango?: string | null;
          consentimiento_datos_en?: string | null;
          consentimiento_compartir_en?: string | null;
          estado?: string;
          clinicas_notificadas?: number | null;
          notificacion_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leads_clinica: {
        Row: {
          id: string;
          solicitud_id: string;
          clinic_id: string;
          token: string;
          estado: string;
          enviado_en: string;
          visto_en: string | null;
          desbloqueado_en: string | null;
        };
        Insert: {
          id?: string;
          solicitud_id: string;
          clinic_id: string;
          token?: string;
          estado?: string;
          enviado_en?: string;
          visto_en?: string | null;
          desbloqueado_en?: string | null;
        };
        Update: {
          id?: string;
          solicitud_id?: string;
          clinic_id?: string;
          token?: string;
          estado?: string;
          enviado_en?: string;
          visto_en?: string | null;
          desbloqueado_en?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          titulo: string;
          resumen: string | null;
          contenido: string;
          imagen_portada: string | null;
          autor: string;
          publicado: boolean;
          publicado_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titulo: string;
          resumen?: string | null;
          contenido?: string;
          imagen_portada?: string | null;
          autor?: string;
          publicado?: boolean;
          publicado_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          titulo?: string;
          resumen?: string | null;
          contenido?: string;
          imagen_portada?: string | null;
          autor?: string;
          publicado?: boolean;
          publicado_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tratamientos: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          tecnica_relacionada: string | null;
          categoria: string | null;
          resumen: string | null;
          contenido: string;
          duracion_orientativa: string | null;
          preguntas_frecuentes: Json;
          imagen_portada: string | null;
          publicado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nombre: string;
          tecnica_relacionada?: string | null;
          categoria?: string | null;
          resumen?: string | null;
          contenido?: string;
          duracion_orientativa?: string | null;
          preguntas_frecuentes?: Json;
          imagen_portada?: string | null;
          publicado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nombre?: string;
          tecnica_relacionada?: string | null;
          categoria?: string | null;
          resumen?: string | null;
          contenido?: string;
          duracion_orientativa?: string | null;
          preguntas_frecuentes?: Json;
          imagen_portada?: string | null;
          publicado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hero_slides: {
        Row: {
          id: string;
          orden: number;
          antes: string | null;
          destacado: string | null;
          despues: string | null;
          subtitulo: string | null;
          titular_html: string;
          color_fondo: string;
          imagen_url: string | null;
          enlace: string;
          texto_boton: string;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          orden?: number;
          antes?: string | null;
          destacado?: string | null;
          despues?: string | null;
          subtitulo?: string | null;
          titular_html: string;
          color_fondo?: string;
          imagen_url?: string | null;
          enlace?: string;
          texto_boton?: string;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          orden?: number;
          antes?: string | null;
          destacado?: string | null;
          despues?: string | null;
          subtitulo?: string | null;
          titular_html?: string;
          color_fondo?: string;
          imagen_url?: string | null;
          enlace?: string;
          texto_boton?: string;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
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
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
export type Tratamiento = Database["public"]["Tables"]["tratamientos"]["Row"];
export type HeroSlide = Database["public"]["Tables"]["hero_slides"]["Row"];
