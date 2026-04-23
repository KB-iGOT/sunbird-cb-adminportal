import { FormBuilder } from '@angular/forms'
import { GradeSettingComponent } from './grade-setting.component'

describe('GradeSettingComponent', () => {
  let component: GradeSettingComponent

  beforeEach(() => {
    component = new GradeSettingComponent(new FormBuilder())
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should build the settings form with default empty values', () => {
      component.ngOnInit()
      expect(component.settingsForm).toBeDefined()
      expect(component.settingsForm.get('group_grade')).toBeDefined()
      expect(component.settingsForm.get('group_grade_other')).toBeDefined()
      expect(component.settingsForm.get('group_grade')!.value).toBe('')
      expect(component.settingsForm.get('group_grade_other')!.value).toBe('')
    })
  })

  describe('onGradeGroupChange', () => {
    it('should set groupGradeValue from event value', () => {
      component.onGradeGroupChange({ value: 'grade_1' })
      expect(component.groupGradeValue).toBe('grade_1')
    })

    it('should update groupGradeValue on subsequent calls', () => {
      component.onGradeGroupChange({ value: 'grade_2' })
      expect(component.groupGradeValue).toBe('grade_2')
      component.onGradeGroupChange({ value: 'grade_4' })
      expect(component.groupGradeValue).toBe('grade_4')
    })
  })

  describe('onOtherChange', () => {
    it('should set groupGradeOtherValue from event value', () => {
      component.onOtherChange({ value: 'custom_grade' })
      expect(component.groupGradeOtherValue).toBe('custom_grade')
    })

    it('should update groupGradeOtherValue on subsequent calls', () => {
      component.onOtherChange({ value: 'first' })
      expect(component.groupGradeOtherValue).toBe('first')
      component.onOtherChange({ value: 'second' })
      expect(component.groupGradeOtherValue).toBe('second')
    })
  })

  describe('gradeList', () => {
    it('should have 4 grades', () => {
      expect(component.gradeList).toHaveLength(4)
      expect(component.gradeList[0].value).toBe('grade_1')
      expect(component.gradeList[3].value).toBe('grade_4')
    })
  })
})
