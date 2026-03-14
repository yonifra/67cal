import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the URL already has a locale prefix, delegate directly to next-intl
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (hasLocalePrefix) {
    return intlMiddleware(request);
  }

  // For the bare root "/" — determine the best locale:
  // 1. Explicit user preference cookie (set by LanguageSwitcher)
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && routing.locales.includes(cookieLocale as any)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${cookieLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // 2. Geo-based: if the user is from Israel, default to Hebrew
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    (request as any).geo?.country ??
    null;

  if (country === 'IL') {
    const url = request.nextUrl.clone();
    url.pathname = `/he${pathname}`;
    return NextResponse.redirect(url);
  }

  // 3. Fall through to next-intl default behaviour (Accept-Language header → defaultLocale)
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|he)/:path*'],
};
