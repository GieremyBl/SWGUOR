export function redirigirTrasPagoExitoso(redirectUrl?: string | null): void {
  if (redirectUrl && typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }
}
