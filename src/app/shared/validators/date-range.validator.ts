import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator to check if the end date is after the start date.
 * @returns ValidatorFn
 */
export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    // Attaches the error to the endDate control to be displayed there
    control.get('endDate')?.setErrors({ dateRange: 'La fecha de fin no puede ser anterior a la de inicio.' });
    return { dateRange: true }; // Returns error on the form group
  }

  // If the date range is valid, but the control had the error, remove it
  if (control.get('endDate')?.hasError('dateRange')) {
    control.get('endDate')?.setErrors(null);
  }

  return null;
};
