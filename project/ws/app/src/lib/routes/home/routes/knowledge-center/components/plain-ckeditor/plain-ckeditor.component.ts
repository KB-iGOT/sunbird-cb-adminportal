import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { DeveloperDocService } from '../../services/developer-doc.service'

declare const CKEDITOR: any

@Component({
  selector: 'ws-app-plain-ckeditor',
  templateUrl: './plain-ckeditor.component.html',
  styleUrl: './plain-ckeditor.component.scss',
  standalone: false,
})
export class PlainCkeditorComponent implements AfterViewInit, OnInit, OnDestroy {
  downloadRegex = new RegExp(`(https://.*?/content-store/.*?)(\\\)?\\\\?['"])`, 'gm')
  uploadRegex = new RegExp(`/apis/authContent(.*?)(\\\)?\\\\?['"])`, 'gm')
  downloadPartialImgRegex = RegExp(` src=\s*['"](.*?)['"]`, 'gm')
  downloadPartialAncRegex = RegExp(` href\=\s*['"](.*?)['"]`, 'gm')

  @Input() doRegex = true
  // @Input() doPartialRegex = false
  @Input() showError = false
  @Output() onTouched = new EventEmitter<void>()
  @Output() value = new EventEmitter<string>()

  html = ''

  @Input() set content(value: string) {
    if (this.doRegex) {
      this.html = value.replace(this.downloadRegex, this.regexDownloadReplace)
    } else {
      this.html = value
    }
  }

  @Input() editorFields: string[] = ['paragraph', 'basicstyles', 'list', 'indent', 'align']
  @ViewChild('editor') editor!: any
  @ViewChild('uploadImage') image!: ElementRef
  imageName = 'Insert Image'
  @ViewChild('uploadFile') file!: ElementRef
  fileName = 'Upload File'
  @ViewChild('addBlank') blank!: ElementRef
  blankName = 'Add Blank'

  config: any

  constructor(
    private configurationSvc: ConfigurationsService,
    private cdr: ChangeDetectorRef,
    private developerDocService: DeveloperDocService
  ) { }

  ngOnInit() {
    this.waitForCKEditor().then(() => {
      this.initiateConfig()
      this.makeTargetAsBlank()
      this.allowAdditionalContents()
    })
    this.configurationSvc.prefChangeNotifier.subscribe(() => {
      const theme = this.theme
      if (this.config && this.config.uiColor !== theme) {
        this.config.uiColor = theme
        this.editor?.instance?.setUiColor(this.theme)
      }
    })
  }

  waitForCKEditor(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof CKEDITOR !== 'undefined') {
        resolve()
      } else {
        const checkInterval = setInterval(() => {
          if (typeof CKEDITOR !== 'undefined') {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      }
    })
  }

  ngAfterViewInit() {
    this.imageName = this.image?.nativeElement?.innerHTML || 'Insert Image'
    this.fileName = this.file?.nativeElement?.innerHTML || 'Upload File'
    this.blankName = this.blank?.nativeElement?.innerHTML || 'Add Blank'
    this.cdr.detectChanges()
    this.editor?.instance?.on('paste', (evt: any) => {
      const data = evt?.data?.dataValue || ''
      const cleanData = data
        .replace(/<(\/)?(b|strong|i|em|u|font|span|style)[^>]*>/gi, '')
        .replace(/ style="[^"]*"/g, '')
      if (evt?.data?.dataValue) {
        evt.data.dataValue = cleanData
      }
    })

    this.editor?.instance?.on('blur', () => {
      this.onTouched.emit()
    })
  }

  ngOnDestroy() {
    this.cdr.detach()
  }

  initiateConfig() {
    this.config = {
      uiColor: this.theme,
      language: this.developerDocService.locale,
      toolbarGroups: [
        {
          name: 'paragraph', groups: ['basicstyles', 'list', 'indent', 'align']
        },
        '/',
      ],
      allowedContent: true,
      extraAllowedContent: 'a[!href,download,document-href,class]',
      removeButtons:
        'Cut,Copy,Paste,PasteText,PasteFromWord,Save,NewPage,Preview,Print,' +
        'Templates,Scayt,Form,Checkbox,Radio,TextField,Textarea,Select,Button,HiddenField,ImageButton' +
        ',Smiley,PageBreak,Flash,About,CreateDiv,Anchor,SelectAll,Image',
      disableNativeSpellChecker: true,
      removeDialogTabs: 'image:advanced;link:advanced',
      format_tags: 'p;h1;h2;h3;h4;h5;h6;div',
      forcePasteAsPlainText: false,
      image2_alignClasses: ['image-align-left', 'image-align-center', 'image-align-right'],
      image2_captionedClass: 'image-captioned',
      stylesSet: [
        {
          name: 'Narrow image',
          type: 'widget',
          widget: 'image',
          attributes: { class: 'image-narrow' },
        },
        {
          name: 'Wide image',
          type: 'widget',
          widget: 'image',
          attributes: { class: 'image-wide' },
        },
      ],
    }
  }

  buildToolbarGroups(): any[] {
    const groups = []
    const fieldConfig: any = {
      'basicstyles': { name: 'basicstyles', group: 'basicstyles' },
      'list': { name: 'list', group: 'list' },
      'indent': { name: 'indent', group: 'indent' },
      'align': { name: 'align', group: 'align' },
    }

    for (const field of this.editorFields) {
      if (fieldConfig[field]) {
        groups.push(fieldConfig[field])
      }
    }

    return groups.length > 0 ? [{ name: 'paragraph', groups: this.editorFields }] : []
  }

  regexUploadReplace(_str = '', group1: string, group2: string): string {
    return `${decodeURIComponent(group1)}${group2}`
  }

  regexDownloadReplace = (_str = '', group1: string, group2: string): string => {
    return `${group1}${group2}`
  }

  onContentChanged() {
    if (this.doRegex) {
      this.value.emit(this.html.replace(this.uploadRegex, this.regexUploadReplace))
    } else {
      this.value.emit(this.html)
    }
  }
  addImageUploadBtn() {
    // Handle image upload button click
    // This method can be extended with upload logic
  }

  addFileUploadBtn() {
    // Handle file upload button click
    // This method can be extended with upload logic
  }

  addBlankBtn() {
    // Handle add blank button click
    // This method can be extended with logic to insert blank content
  }
  makeTargetAsBlank() {
    if (CKEDITOR) {
      CKEDITOR.on('dialogDefinition', (ev: any) => {
        try {
          const dialogName = ev.data.name
          const dialogDefinition = ev.data.definition
          if (dialogName === 'link') {
            const informationTab = dialogDefinition.getContents('target')
            const targetField = informationTab.get('linkTargetType')
            targetField['default'] = '_blank'
          }
        } catch (exception) {
          // Handle error silently
        }
      })
    }
  }

  allowAdditionalContents() {
    if (CKEDITOR) {
      CKEDITOR.dtd['a']['div'] = 1
      CKEDITOR.dtd['a']['p'] = 1
      CKEDITOR.dtd['a']['i'] = 1
      CKEDITOR.dtd['a']['span'] = 1
    }
  }

  get theme(): string {
    const color = (getComputedStyle(document.body as any).backgroundColor as any)
      .replace('rgba', '')
      .replace('rgb', '')
      .replace('(', '')
      .replace(')', '')
      .split(',')
    return (
      '#' +
      ('0' + parseInt(color[0], 10).toString(16)).slice(-2) +
      ('0' + parseInt(color[1], 10).toString(16)).slice(-2) +
      ('0' + parseInt(color[2], 10).toString(16)).slice(-2)
    )
  }
}
