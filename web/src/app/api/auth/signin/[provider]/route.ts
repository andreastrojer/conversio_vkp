import {handlers} from '@/lib/auth'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return Response.redirect(new URL('/login', request.url))
}

export const POST = handlers.POST
