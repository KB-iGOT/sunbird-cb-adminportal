import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'

import { WidgetContentService } from './widget-content.service'

describe('WidgetContentService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ConfigurationsService, useValue: { sitePath: '' } },
    ],
  }))

  it('should be created', () => {
    const service: WidgetContentService = TestBed.inject(WidgetContentService)
    expect(service).toBeTruthy()
  })

  describe('continueLearning', () => {
    it('should save playlist progress with context and resolve true', async () => {
      const service: WidgetContentService = TestBed.inject(WidgetContentService)
      const save = jest.spyOn(service, 'saveContinueLearning').mockReturnValue(of({}))
      await expect(service.continueLearning('do_1', 'do_p', 'Playlist')).resolves.toBe(true)
      expect(save).toHaveBeenCalledWith(expect.objectContaining({
        contextPathId: 'do_p',
        resourceId: 'do_1',
        contextType: 'playlist',
      }))
    })

    it('should save progress without collection and resolve true', async () => {
      const service: WidgetContentService = TestBed.inject(WidgetContentService)
      const save = jest.spyOn(service, 'saveContinueLearning').mockReturnValue(of({}))
      await expect(service.continueLearning('do_1')).resolves.toBe(true)
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ contextPathId: 'do_1', resourceId: 'do_1' }))
    })

    it('should still resolve true when saving fails', async () => {
      const service: WidgetContentService = TestBed.inject(WidgetContentService)
      jest.spyOn(service, 'saveContinueLearning').mockReturnValue(throwError(new Error('failed')))
      await expect(service.continueLearning('do_1')).resolves.toBe(true)
    })
  })
})
