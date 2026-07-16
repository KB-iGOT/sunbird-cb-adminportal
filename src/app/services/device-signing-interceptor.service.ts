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
    if (!req.url.startsWith('/apis/') || req.url.includes('public') || !this.deviceKeySvc.isSupported) {
      return next.handle(req)
    }
    return from(this.buildSignatureHeaders(req)).pipe(
      switchMap(headers => next.handle(headers ? req.clone({ setHeaders: headers }) : req)),
    )
  }

  private async buildSignatureHeaders(req: HttpRequest<any>): Promise<{ [header: string]: string } | null> {
    try {
      const ts = Date.now().toString()
      const nonce = this.deviceKeySvc.generateNonce()
      // ui-proxy sees the path without the /apis prefix (stripped by ingress), so sign it without the prefix
      const path = req.urlWithParams.replace(/^\/apis/, '')
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
