
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "etiquetas_seguidas": {
                  Row: {
                    "created_at": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"tag_id": string
                  }
                  Update: {
                    "created_at"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "etiquetas_seguidas_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: true
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "cantidad": number,"costo_unitario": number,"id": string,"order_id": string,"precio_unitario": number,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad": number,"costo_unitario": number,"id"?: string,"order_id": string,"precio_unitario": number,"product_id": string
                  }
                  Update: {
                    "cantidad"?: number,"costo_unitario"?: number,"id"?: string,"order_id"?: string,"precio_unitario"?: number,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "cancelado_at": string | null,"cliente": string,"created_at": string,"estado": string,"id": string,"numero": number,"telefono": string,"total": number,"vendido_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cancelado_at"?: string | null,"cliente": string,"created_at"?: string,"estado"?: string,"id"?: string,"numero"?: never,"telefono": string,"total": number,"vendido_at"?: string | null
                  }
                  Update: {
                    "cancelado_at"?: string | null,"cliente"?: string,"created_at"?: string,"estado"?: string,"id"?: string,"numero"?: never,"telefono"?: string,"total"?: number,"vendido_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"product_costs": {
                  Row: {
                    "costo": number,"product_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "costo": number,"product_id": string,"updated_at"?: string
                  }
                  Update: {
                    "costo"?: number,"product_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_costs_product_id_fkey"
      columns: ["product_id"]
isOneToOne: true
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "created_at": string,"id": string,"orden": number,"path": string,"path_miniatura": string,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"orden": number,"path": string,"path_miniatura": string,"product_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"orden"?: number,"path"?: string,"path_miniatura"?: string,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_tags": {
                  Row: {
                    "product_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "product_id": string,"tag_id": string
                  }
                  Update: {
                    "product_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_tags_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "activo": boolean,"created_at": string,"descripcion": string,"id": string,"nombre": string,"precio": number,"stock": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"created_at"?: string,"descripcion"?: string,"id"?: string,"nombre": string,"precio": number,"stock"?: number,"updated_at"?: string
                  }
                  Update: {
                    "activo"?: boolean,"created_at"?: string,"descripcion"?: string,"id"?: string,"nombre"?: string,"precio"?: number,"stock"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "id": boolean,"updated_at": string,"whatsapp_mensaje": string,"whatsapp_numero": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"updated_at"?: string,"whatsapp_mensaje": string,"whatsapp_numero"?: string
                  }
                  Update: {
                    "id"?: boolean,"updated_at"?: string,"whatsapp_mensaje"?: string,"whatsapp_numero"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tags": {
                  Row: {
                    "created_at": string,"id": string,"nombre": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"nombre": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"nombre"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "cancelar_pedido":
{ Args: { "p_pedido_id": string }; Returns: Json
                           },
"crear_pedido":
{ Args: { "p_cliente": string,"p_items": Json,"p_telefono": string,"p_total_esperado"?: number }; Returns: Json
                           },
"es_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"guardar_etiquetas_seguidas":
{ Args: { "p_ids": (string)[] }; Returns: undefined
                           },
"guardar_producto":
{ Args: { "p": Json }; Returns: Json
                           },
"marcar_vendido":
{ Args: { "p_pedido_id": string }; Returns: Json
                           },
"renombrar_etiqueta":
{ Args: { "p_id": string,"p_nombre": string }; Returns: Json
                           },
"resumen_etiquetas":
{ Args: { "p_ahora"?: string }; Returns: {
              "id": string,"nombre": string,"piezas": number,"productos": number,"seguida": boolean,"unidades": number,"vendidas_mes": number,"vendidas_total": number
            }[]
                           },
"resumen_panel":
{ Args: { "p_ahora"?: string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
