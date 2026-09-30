/**
 * Tipos de la base de datos de Growwly.
 *
 * Generado con `supabase gen types typescript --project-id <id>`
 * (vía MCP de Supabase). Para regenerar tras una migración nueva:
 *
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          autor: string
          autor_cargo: string | null
          contenido: string
          created_at: string
          destacado_home: boolean
          id: string
          imagen_portada: string | null
          preguntas_frecuentes: Json
          publicado: boolean
          publicado_en: string | null
          resumen: string | null
          slug: string
          tags: string[]
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string
          autor_cargo?: string | null
          contenido?: string
          created_at?: string
          destacado_home?: boolean
          id?: string
          imagen_portada?: string | null
          preguntas_frecuentes?: Json
          publicado?: boolean
          publicado_en?: string | null
          resumen?: string | null
          slug: string
          tags?: string[]
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string
          autor_cargo?: string | null
          contenido?: string
          created_at?: string
          destacado_home?: boolean
          id?: string
          imagen_portada?: string | null
          preguntas_frecuentes?: Json
          publicado?: boolean
          publicado_en?: string | null
          resumen?: string | null
          slug?: string
          tags?: string[]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_contact_clicks: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          metodo: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          metodo: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          metodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_contact_clicks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_page_views: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_page_views_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          accesibilidad: string | null
          accesibilidad_checks: string[]
          acepta_videoconsulta: boolean
          certificados: string[]
          ciudad: string | null
          comunidad_autonoma: string | null
          created_at: string
          datos_facturacion: Json | null
          descripcion: string | null
          descripcion_extendida: string | null
          destacado: boolean
          destacado_ciudad: boolean
          destacado_ciudad_solicitado: boolean
          destacado_home: boolean
          destacado_home_solicitado: boolean
          destacado_solicitado: boolean
          detalle_oferta: string | null
          direccion: string | null
          email: string | null
          financiacion: boolean
          fotos: string[]
          fotos_antes_despues: Json
          google_place_id: string | null
          google_reviews: Json
          google_synced_at: string | null
          horarios: string | null
          horarios_estructurados: Json
          id: string
          idiomas: string[]
          lat: number | null
          leads_enabled: boolean
          lng: number | null
          logo_url: string | null
          medicos: Json
          nombre: string
          opiniones: Json
          orden: number
          plan: string
          plan_solicitado: string | null
          precio_desde: number | null
          precio_hasta: number | null
          primera_consulta_gratis: boolean
          provincia: string
          publicado: boolean
          rango_precios: string | null
          rating_doctoralia: number | null
          rating_google: number | null
          redes_sociales: Json
          resenas_doctoralia: number | null
          resenas_google: number | null
          reserva_online_url: string | null
          servicios_adicionales: string[]
          slug: string
          slugs_antiguos: string[]
          tecnicas: string[]
          telefono: string | null
          tiene_oferta: boolean
          tipo_negocio: string | null
          updated_at: string
          verificado: boolean
          verificado_admin: boolean
          video_url: string | null
          visibilidad_fechas: Json
          web: string | null
          zona: string | null
        }
        Insert: {
          accesibilidad?: string | null
          accesibilidad_checks?: string[]
          acepta_videoconsulta?: boolean
          certificados?: string[]
          ciudad?: string | null
          comunidad_autonoma?: string | null
          created_at?: string
          datos_facturacion?: Json | null
          descripcion?: string | null
          descripcion_extendida?: string | null
          destacado?: boolean
          destacado_ciudad?: boolean
          destacado_ciudad_solicitado?: boolean
          destacado_home?: boolean
          destacado_home_solicitado?: boolean
          destacado_solicitado?: boolean
          detalle_oferta?: string | null
          direccion?: string | null
          email?: string | null
          financiacion?: boolean
          fotos?: string[]
          fotos_antes_despues?: Json
          google_place_id?: string | null
          google_reviews?: Json
          google_synced_at?: string | null
          horarios?: string | null
          horarios_estructurados?: Json
          id?: string
          idiomas?: string[]
          lat?: number | null
          leads_enabled?: boolean
          lng?: number | null
          logo_url?: string | null
          medicos?: Json
          nombre: string
          opiniones?: Json
          orden?: number
          plan?: string
          plan_solicitado?: string | null
          precio_desde?: number | null
          precio_hasta?: number | null
          primera_consulta_gratis?: boolean
          provincia?: string
          publicado?: boolean
          rango_precios?: string | null
          rating_doctoralia?: number | null
          rating_google?: number | null
          redes_sociales?: Json
          resenas_doctoralia?: number | null
          resenas_google?: number | null
          reserva_online_url?: string | null
          servicios_adicionales?: string[]
          slug: string
          slugs_antiguos?: string[]
          tecnicas?: string[]
          telefono?: string | null
          tiene_oferta?: boolean
          tipo_negocio?: string | null
          updated_at?: string
          verificado?: boolean
          verificado_admin?: boolean
          video_url?: string | null
          visibilidad_fechas?: Json
          web?: string | null
          zona?: string | null
        }
        Update: {
          accesibilidad?: string | null
          accesibilidad_checks?: string[]
          acepta_videoconsulta?: boolean
          certificados?: string[]
          ciudad?: string | null
          comunidad_autonoma?: string | null
          created_at?: string
          datos_facturacion?: Json | null
          descripcion?: string | null
          descripcion_extendida?: string | null
          destacado?: boolean
          destacado_ciudad?: boolean
          destacado_ciudad_solicitado?: boolean
          destacado_home?: boolean
          destacado_home_solicitado?: boolean
          destacado_solicitado?: boolean
          detalle_oferta?: string | null
          direccion?: string | null
          email?: string | null
          financiacion?: boolean
          fotos?: string[]
          fotos_antes_despues?: Json
          google_place_id?: string | null
          google_reviews?: Json
          google_synced_at?: string | null
          horarios?: string | null
          horarios_estructurados?: Json
          id?: string
          idiomas?: string[]
          lat?: number | null
          leads_enabled?: boolean
          lng?: number | null
          logo_url?: string | null
          medicos?: Json
          nombre?: string
          opiniones?: Json
          orden?: number
          plan?: string
          plan_solicitado?: string | null
          precio_desde?: number | null
          precio_hasta?: number | null
          primera_consulta_gratis?: boolean
          provincia?: string
          publicado?: boolean
          rango_precios?: string | null
          rating_doctoralia?: number | null
          rating_google?: number | null
          redes_sociales?: Json
          resenas_doctoralia?: number | null
          resenas_google?: number | null
          reserva_online_url?: string | null
          servicios_adicionales?: string[]
          slug?: string
          slugs_antiguos?: string[]
          tecnicas?: string[]
          telefono?: string | null
          tiene_oferta?: boolean
          tipo_negocio?: string | null
          updated_at?: string
          verificado?: boolean
          verificado_admin?: boolean
          video_url?: string | null
          visibilidad_fechas?: Json
          web?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      estudios_capilares: {
        Row: {
          claim_token: string
          created_at: string
          error_detalle: string | null
          es_alopecia_tratable: boolean | null
          estado: string
          flujo: string | null
          foto_coronilla: string | null
          foto_donante: string | null
          foto_frontal: string | null
          foto_perfil_derecho: string | null
          foto_perfil_izquierdo: string | null
          fotos_adicionales: string[]
          id: string
          informe: Json | null
          norwood_estimado: string | null
          resultado_texto: string | null
          user_id: string | null
        }
        Insert: {
          claim_token?: string
          created_at?: string
          error_detalle?: string | null
          es_alopecia_tratable?: boolean | null
          estado?: string
          flujo?: string | null
          foto_coronilla?: string | null
          foto_donante?: string | null
          foto_frontal?: string | null
          foto_perfil_derecho?: string | null
          foto_perfil_izquierdo?: string | null
          fotos_adicionales?: string[]
          id?: string
          informe?: Json | null
          norwood_estimado?: string | null
          resultado_texto?: string | null
          user_id?: string | null
        }
        Update: {
          claim_token?: string
          created_at?: string
          error_detalle?: string | null
          es_alopecia_tratable?: boolean | null
          estado?: string
          flujo?: string | null
          foto_coronilla?: string | null
          foto_donante?: string | null
          foto_frontal?: string | null
          foto_perfil_derecho?: string | null
          foto_perfil_izquierdo?: string | null
          fotos_adicionales?: string[]
          id?: string
          informe?: Json | null
          norwood_estimado?: string | null
          resultado_texto?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estudios_capilares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          activo: boolean
          color_fondo: string
          created_at: string
          enlace: string
          id: string
          imagen_url: string | null
          orden: number
          subtitulo: string | null
          texto_boton: string
          titular_html: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color_fondo?: string
          created_at?: string
          enlace?: string
          id?: string
          imagen_url?: string | null
          orden?: number
          subtitulo?: string | null
          texto_boton?: string
          titular_html: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color_fondo?: string
          created_at?: string
          enlace?: string
          id?: string
          imagen_url?: string | null
          orden?: number
          subtitulo?: string | null
          texto_boton?: string
          titular_html?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          clinic_id: string | null
          created_at: string
          event: string
          id: string
          lead_id: string | null
          metadata: Json
          solicitud_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          event: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          solicitud_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          event?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          solicitud_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_presupuesto"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_clinica: {
        Row: {
          cita_pendiente_en: string | null
          cita_programada_en: string | null
          cita_realizada_en: string | null
          clinic_id: string
          convertido_en: string | null
          desbloqueado_en: string | null
          descartado_por_paciente_en: string | null
          enviado_en: string
          estado: string
          fecha_cita: string | null
          feedback_comentario: string | null
          feedback_puntuacion: number | null
          feedback_recibido_en: string | null
          id: string
          match_score: number | null
          no_convertido_en: string | null
          opciones_cita: Json
          otras_fechas_pedidas_en: string | null
          propuesta_enviada_en: string | null
          propuesta_vista_en: string | null
          recordatorio_feedback_enviado_en: string | null
          seleccionado_en: string | null
          solicitud_id: string
          token: string
          visto_en: string | null
        }
        Insert: {
          cita_pendiente_en?: string | null
          cita_programada_en?: string | null
          cita_realizada_en?: string | null
          clinic_id: string
          convertido_en?: string | null
          desbloqueado_en?: string | null
          descartado_por_paciente_en?: string | null
          enviado_en?: string
          estado?: string
          fecha_cita?: string | null
          feedback_comentario?: string | null
          feedback_puntuacion?: number | null
          feedback_recibido_en?: string | null
          id?: string
          match_score?: number | null
          no_convertido_en?: string | null
          opciones_cita?: Json
          otras_fechas_pedidas_en?: string | null
          propuesta_enviada_en?: string | null
          propuesta_vista_en?: string | null
          recordatorio_feedback_enviado_en?: string | null
          seleccionado_en?: string | null
          solicitud_id: string
          token?: string
          visto_en?: string | null
        }
        Update: {
          cita_pendiente_en?: string | null
          cita_programada_en?: string | null
          cita_realizada_en?: string | null
          clinic_id?: string
          convertido_en?: string | null
          desbloqueado_en?: string | null
          descartado_por_paciente_en?: string | null
          enviado_en?: string
          estado?: string
          fecha_cita?: string | null
          feedback_comentario?: string | null
          feedback_puntuacion?: number | null
          feedback_recibido_en?: string | null
          id?: string
          match_score?: number | null
          no_convertido_en?: string | null
          opciones_cita?: Json
          otras_fechas_pedidas_en?: string | null
          propuesta_enviada_en?: string | null
          propuesta_vista_en?: string | null
          recordatorio_feedback_enviado_en?: string | null
          seleccionado_en?: string | null
          solicitud_id?: string
          token?: string
          visto_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinica_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_clinica_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_presupuesto"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          created_at: string
          id: string
          nombre: string
          provincia: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          provincia: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          provincia?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acepta_marketing_email: boolean
          apellidos: string | null
          ciudad: string | null
          clinic_id: string | null
          clinic_status: string | null
          created_at: string
          edad: number | null
          email: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string | null
          role: string
          sexo: string | null
          telefono: string | null
          tipo_perdida_cabello: string | null
          updated_at: string
        }
        Insert: {
          acepta_marketing_email?: boolean
          apellidos?: string | null
          ciudad?: string | null
          clinic_id?: string | null
          clinic_status?: string | null
          created_at?: string
          edad?: number | null
          email?: string | null
          fecha_nacimiento?: string | null
          id: string
          nombre?: string | null
          role?: string
          sexo?: string | null
          telefono?: string | null
          tipo_perdida_cabello?: string | null
          updated_at?: string
        }
        Update: {
          acepta_marketing_email?: boolean
          apellidos?: string | null
          ciudad?: string | null
          clinic_id?: string | null
          clinic_status?: string | null
          created_at?: string
          edad?: number | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string | null
          role?: string
          sexo?: string | null
          telefono?: string | null
          tipo_perdida_cabello?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      propuestas_clinica: {
        Row: {
          actualizado_en: string
          creado_en: string
          disponibilidad: string | null
          id: string
          incluye: string[]
          lead_id: string
          mensaje: string | null
          precio_max: number | null
          precio_min: number | null
          tipo_consulta: string | null
          tipo_precio: string
          tratamiento: string | null
          valido_hasta: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          disponibilidad?: string | null
          id?: string
          incluye?: string[]
          lead_id: string
          mensaje?: string | null
          precio_max?: number | null
          precio_min?: number | null
          tipo_consulta?: string | null
          tipo_precio: string
          tratamiento?: string | null
          valido_hasta?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          disponibilidad?: string | null
          id?: string
          incluye?: string[]
          lead_id?: string
          mensaje?: string | null
          precio_max?: number | null
          precio_min?: number | null
          tipo_consulta?: string | null
          tipo_precio?: string
          tratamiento?: string | null
          valido_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_clinica_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads_clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_cita_directa: {
        Row: {
          clinic_id: string
          creado_en: string
          email: string | null
          id: string
          mensaje: string | null
          nombre: string
          telefono: string
        }
        Insert: {
          clinic_id: string
          creado_en?: string
          email?: string | null
          id?: string
          mensaje?: string | null
          nombre: string
          telefono: string
        }
        Update: {
          clinic_id?: string
          creado_en?: string
          email?: string | null
          id?: string
          mensaje?: string | null
          nombre?: string
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_cita_directa_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_presupuesto: {
        Row: {
          alergias: string | null
          antecedentes_familiares: string | null
          cambios_salud_recientes: string | null
          cirugias_previas: string | null
          ciudad: string | null
          clinicas_notificadas: number | null
          codigo_postal: string | null
          condiciones_medicas: string[]
          consentimiento_compartir_en: string | null
          consentimiento_datos_en: string | null
          consentimiento_fotos_en: string | null
          consentimiento_info_medica_en: string | null
          consentimiento_terminos_en: string | null
          created_at: string
          cuando_tratamiento: string | null
          dejar_decidir_medico: boolean
          donde_tratamiento: string | null
          estado: string
          estudio_id: string | null
          fumador: string | null
          id: string
          medicacion_actual: string | null
          notificacion_error: string | null
          presupuesto_rango: string | null
          prioridad_decision: string | null
          progresion_perdida: string | null
          sintomas_cuero_cabelludo: string[]
          tratamientos_interes: string[]
          tratamientos_usados: string[]
          tratamientos_usados_detalle: string | null
          user_id: string
        }
        Insert: {
          alergias?: string | null
          antecedentes_familiares?: string | null
          cambios_salud_recientes?: string | null
          cirugias_previas?: string | null
          ciudad?: string | null
          clinicas_notificadas?: number | null
          codigo_postal?: string | null
          condiciones_medicas?: string[]
          consentimiento_compartir_en?: string | null
          consentimiento_datos_en?: string | null
          consentimiento_fotos_en?: string | null
          consentimiento_info_medica_en?: string | null
          consentimiento_terminos_en?: string | null
          created_at?: string
          cuando_tratamiento?: string | null
          dejar_decidir_medico?: boolean
          donde_tratamiento?: string | null
          estado?: string
          estudio_id?: string | null
          fumador?: string | null
          id?: string
          medicacion_actual?: string | null
          notificacion_error?: string | null
          presupuesto_rango?: string | null
          prioridad_decision?: string | null
          progresion_perdida?: string | null
          sintomas_cuero_cabelludo?: string[]
          tratamientos_interes?: string[]
          tratamientos_usados?: string[]
          tratamientos_usados_detalle?: string | null
          user_id: string
        }
        Update: {
          alergias?: string | null
          antecedentes_familiares?: string | null
          cambios_salud_recientes?: string | null
          cirugias_previas?: string | null
          ciudad?: string | null
          clinicas_notificadas?: number | null
          codigo_postal?: string | null
          condiciones_medicas?: string[]
          consentimiento_compartir_en?: string | null
          consentimiento_datos_en?: string | null
          consentimiento_fotos_en?: string | null
          consentimiento_info_medica_en?: string | null
          consentimiento_terminos_en?: string | null
          created_at?: string
          cuando_tratamiento?: string | null
          dejar_decidir_medico?: boolean
          donde_tratamiento?: string | null
          estado?: string
          estudio_id?: string | null
          fumador?: string | null
          id?: string
          medicacion_actual?: string | null
          notificacion_error?: string | null
          presupuesto_rango?: string | null
          prioridad_decision?: string | null
          progresion_perdida?: string | null
          sintomas_cuero_cabelludo?: string[]
          tratamientos_interes?: string[]
          tratamientos_usados?: string[]
          tratamientos_usados_detalle?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_presupuesto_estudio_id_fkey"
            columns: ["estudio_id"]
            isOneToOne: false
            referencedRelation: "estudios_capilares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_presupuesto_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tratamientos: {
        Row: {
          categoria: string | null
          contenido: string
          created_at: string
          destacado_home: boolean
          duracion_orientativa: string | null
          id: string
          imagen_portada: string | null
          nombre: string
          preguntas_frecuentes: Json
          publicado: boolean
          resumen: string | null
          slug: string
          tecnica_relacionada: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          contenido?: string
          created_at?: string
          destacado_home?: boolean
          duracion_orientativa?: string | null
          id?: string
          imagen_portada?: string | null
          nombre: string
          preguntas_frecuentes?: Json
          publicado?: boolean
          resumen?: string | null
          slug: string
          tecnica_relacionada?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          contenido?: string
          created_at?: string
          destacado_home?: boolean
          duracion_orientativa?: string | null
          id?: string
          imagen_portada?: string | null
          nombre?: string
          preguntas_frecuentes?: Json
          publicado?: boolean
          resumen?: string | null
          slug?: string
          tecnica_relacionada?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      zonas: {
        Row: {
          created_at: string
          id: string
          municipio: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipio: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          municipio?: string
          nombre?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type EstudioCapilar =
  Database["public"]["Tables"]["estudios_capilares"]["Row"]
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]
export type Tratamiento = Database["public"]["Tables"]["tratamientos"]["Row"]
export type HeroSlide = Database["public"]["Tables"]["hero_slides"]["Row"]
