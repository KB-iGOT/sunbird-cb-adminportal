import { Injectable } from '@angular/core'
import { MarketplaceService } from './marketplace.service'
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router'
import { IResolveResponse } from '@sunbird-cb/utils-v2'
// import { of } from 'rxjs'
// import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'
// import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class ProviderResolveService implements Resolve<IResolveResponse<any>> {

  constructor(
    private marketPlaceSvc: MarketplaceService
  ) { }

  async resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Promise<IResolveResponse<any>> {
    const partnerId = _route.paramMap.get('id') || _route.queryParamMap.get('id')
    const canView = _route.queryParamMap.get('status') || _route.paramMap.get('status')
    if (partnerId && canView === 'PENDING') {
      try {
        const response: any = await this.marketPlaceSvc.readRegisteredProviderDetails(partnerId).toPromise()
        if (response?.params?.status === 'success') {
          return { data: response, error: null }
          // tslint:disable-next-line:no-else-after-return
        } else {
          return { data: null, error: response?.params?.errMsg }
        }
      } catch (error: any) {
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong, please try again later')
        return { data: null, error: errmsg }
      }

      // tslint:disable-next-line:no-else-after-return
    } else if (partnerId) {
      try {
        const response: any = await this.marketPlaceSvc.getProviderDetails(partnerId).toPromise()
        if (response?.params?.status === 'success') {
          return { data: response, error: null }
          // tslint:disable-next-line:no-else-after-return
        } else {
          return { data: null, error: response?.params?.errMsg }
        }
      } catch (error: any) {
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong, please try again later')
        return { data: null, error: errmsg }
      }
    }
    return {
      data: null,
      error: null,
    }
  }
}
