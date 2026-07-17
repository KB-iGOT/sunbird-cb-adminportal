import { Injectable } from '@angular/core'
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http'
import { Observable, from } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { DeviceKeyService } from './device-key.service'

/**
 * Signs every backend API call with this browser's non-extractable device key
 * so ui-proxy can reject a session cookie replayed from a different browser.
 * Public endpoints and non-API requests are left untouched.
 */
@Injectable({ providedIn: 'root' })
export class DeviceSigningInterceptorService implements HttpInterceptor {
  constructor(private deviceKeySvc: DeviceKeyService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const apiPath = this.toApiPath(req.urlWithParams)
    if (!apiPath || !this.deviceKeySvc.isSupported) {
      return next.handle(req)
    }
    return from(this.buildSignatureHeaders(req, apiPath)).pipe(
      switchMap(headers => next.handle(headers ? req.clone({ setHeaders: headers }) : req)),
    )
  }

  /**
   * Services build API URLs three ways: '/apis/...', 'apis/...' (no leading slash) and
   * absolute same-origin URLs from config (e.g. telemetry's protectedEndpoint). All resolve
   * to the same endpoint — normalize to the site-relative path, or null when not a signable API.
   */
  private toApiPath(url: string): string | null {
    let path = url
    if (/^https?:\/\//i.test(url)) {
      try {
        const parsed = new URL(url)
        if (parsed.origin !== location.origin) {
          return null
        }
        path = `${parsed.pathname}${parsed.search}`
      } catch {
        return null
      }
    } else if (!path.startsWith('/')) {
      path = `/${path}`
    }
    return path.startsWith('/apis/') && !path.includes('public') ? path : null
  }

  private async buildSignatureHeaders(req: HttpRequest<any>, apiPath: string): Promise<{ [header: string]: string } | null> {
    try {
      const ts = Date.now().toString()
      const nonce = this.deviceKeySvc.generateNonce()
      // ui-proxy sees the path without the /apis prefix (stripped by ingress), so sign it without the prefix
      const path = apiPath.replace(/^\/apis/, '')
      const signature = await this.deviceKeySvc.sign(`${req.method}|${path}|${ts}|${nonce}`)
      const publicKey = await this.deviceKeySvc.getPublicKeyB64()
      return {
        'X-Device-Key': publicKey,
        'X-Device-Nonce': nonce,
        'X-Device-Signature': signature,
        'X-Device-Ts': ts,
      }
    } catch {
      // fail open on the client: ui-proxy decides (log vs enforce mode) how to treat unsigned requests
      return null
    }
  }
}
