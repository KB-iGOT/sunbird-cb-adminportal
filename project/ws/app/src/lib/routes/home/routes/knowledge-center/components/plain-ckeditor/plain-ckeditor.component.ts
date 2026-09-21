import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import {
  Alignment,
  Bold,
  ClassicEditor,
  Essentials,
  Indent,
  IndentBlock,
  Italic,
  List,
  Paragraph,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from 'ckeditor5'

@Component({
  selector: 'ws-app-plain-ckeditor',
  templateUrl: './plain-ckeditor.component.html',
  styleUrl: './plain-ckeditor.component.scss',
  standalone: false,
})
export class PlainCkeditorComponent implements OnInit {
  downloadRegex = new RegExp(`(https://.*?/content-store/.*?)(\\\)?\\\\?['"])`, 'gm')
  uploadRegex = new RegExp(`/apis/authContent(.*?)(\\\)?\\\\?['"])`, 'gm')

  @Input() doRegex = true
  @Input() showError = false
  @Output() onTouched = new EventEmitter<void>()
  @Output() value = new EventEmitter<string>()

  html = ''

  @Input() set content(val: string) {
    if (this.doRegex) {
      this.html = val.replace(this.downloadRegex, this.regexDownloadReplace)
    } else {
      this.html = val
    }
  }
  // tslint:disable-next-line:variable-name
  Editor = ClassicEditor

  config = {
    plugins: [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      Subscript,
      Superscript,
      List,
      Indent,
      IndentBlock,
      Alignment,
    ],
    toolbar: {
      items: [
        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
        '|',
        'numberedList', 'bulletedList',
        '|',
        'outdent', 'indent',
        '|',
        'alignment:left', 'alignment:center', 'alignment:right', 'alignment:justify',
      ],
    },
  }

  constructor() { }

  ngOnInit() { }

  regexUploadReplace(_str = '', group1: string, group2: string): string {
    return `${decodeURIComponent(group1)}${group2}`
  }

  regexDownloadReplace = (_str = '', group1: string, group2: string): string => {
    return `${group1}${group2}`
  }

  onContentChanged({ editor }: { editor: any }) {
    this.html = editor.getData()
    if (this.doRegex) {
      this.value.emit(this.html.replace(this.uploadRegex, this.regexUploadReplace))
    } else {
      this.value.emit(this.html)
    }
  }

  onBlur() {
    this.onTouched.emit()
  }
}
