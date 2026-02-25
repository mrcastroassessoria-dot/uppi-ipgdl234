import { NextRequest, NextResponse } from 'next/server'
import { createClient } from './supabase/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}

export function errorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.error('[v0] Error getting current user:', error)
    return null
  }
  
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Não autenticado')
  }
  
  return user
}

export async function getCurrentUserWithProfile() {
  const user = await requireAuth()
  
  const supabase = await createClient()
  
  const { data: dbUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('[v0] Error fetching user from database:', error)
    throw new Error('Erro ao buscar perfil do usuário')
  }
  
  return { authUser: user, dbUser }
}

export async function requireRole(allowedRoles: string[]) {
  const { dbUser } = await getCurrentUserWithProfile()
  
  if (!allowedRoles.includes(dbUser.role)) {
    throw new Error('Acesso negado')
  }
  
  return dbUser
}

export async function requireDriver() {
  const user = await requireAuth()
  
  const supabase = await createClient()
  
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (error || !driver) {
    console.error('[v0] Error fetching driver:', error)
    throw new Error('Motorista não encontrado')
  }
  
  if (driver.status !== 'approved') {
    throw new Error('Motorista não aprovado')
  }
  
  return driver
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('[v0] API Error:', error)
  
  if (error instanceof Error) {
    if (error.message === 'Não autenticado') {
      return errorResponse('Autenticação necessária', 401)
    }
    if (error.message === 'Acesso negado') {
      return errorResponse('Você não tem permissão para acessar este recurso', 403)
    }
    return errorResponse(error.message, 400)
  }
  
  return errorResponse('Erro interno do servidor', 500)
}

export async function validateRequest<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    console.error('[v0] Validation error:', error)
    throw new Error('Dados inválidos')
  }
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    return handleApiError(error)
  }
}
