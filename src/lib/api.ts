import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function validationErr(error: ZodError) {
  const messages = error.errors.map(e => e.message).join(', ')
  return err(messages, 422)
}

export function unauthorized() {
  return err('Não autorizado', 401)
}

export function forbidden() {
  return err('Acesso negado', 403)
}

export function notFound(resource = 'Recurso') {
  return err(`${resource} não encontrado`, 404)
}

export function serverError() {
  return err('Erro interno do servidor', 500)
}

export function handleAuthError(e: unknown): NextResponse {
  if (e instanceof Error) {
    if (e.message === 'UNAUTHORIZED') return unauthorized()
    if (e.message === 'FORBIDDEN')    return forbidden()
  }
  console.error('[server error]', e)
  return serverError()
}
