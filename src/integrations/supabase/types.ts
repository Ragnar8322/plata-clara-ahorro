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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      configuracion: {
        Row: {
          created_at: string
          estrategia_orden_deudas: string
          id: string
          ingreso_mensual_neto: number
          meses_max_proyeccion: number
          moneda_simbolo: string
          nombre_moneda: string
          presupuesto_mensual_para_deudas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estrategia_orden_deudas?: string
          id?: string
          ingreso_mensual_neto?: number
          meses_max_proyeccion?: number
          moneda_simbolo?: string
          nombre_moneda?: string
          presupuesto_mensual_para_deudas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estrategia_orden_deudas?: string
          id?: string
          ingreso_mensual_neto?: number
          meses_max_proyeccion?: number
          moneda_simbolo?: string
          nombre_moneda?: string
          presupuesto_mensual_para_deudas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deudas: {
        Row: {
          activa: boolean
          created_at: string
          dia_corte_o_pago: number
          entidad: string
          id: string
          nombre: string
          notas: string | null
          pago_extra_planeado_mensual: number
          pago_minimo_mensual: number
          saldo_actual: number
          saldo_inicial: number
          tasa_interes_anual: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          dia_corte_o_pago: number
          entidad: string
          id?: string
          nombre: string
          notas?: string | null
          pago_extra_planeado_mensual?: number
          pago_minimo_mensual: number
          saldo_actual: number
          saldo_inicial: number
          tasa_interes_anual: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          dia_corte_o_pago?: number
          entidad?: string
          id?: string
          nombre?: string
          notas?: string | null
          pago_extra_planeado_mensual?: number
          pago_minimo_mensual?: number
          saldo_actual?: number
          saldo_inicial?: number
          tasa_interes_anual?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gastos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string
          fecha: string
          frecuencia: string
          id: string
          metodo_pago: string
          monto: number
          notas: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion: string
          fecha: string
          frecuencia: string
          id?: string
          metodo_pago: string
          monto: number
          notas?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string
          fecha?: string
          frecuencia?: string
          id?: string
          metodo_pago?: string
          monto?: number
          notas?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
