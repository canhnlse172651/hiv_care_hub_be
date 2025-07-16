export class OrganFunctionService {
  validateOrganFunction(
    liverFunction: { alt: number; ast: number; bilirubin: number },
    kidneyFunction: { creatinine: number; egfr: number },
    protocolId: number,
  ): {
    liverStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    kidneyStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    doseAdjustmentsRequired: string[]
    contraindicatedMedications: string[]
    monitoringRequirements: string[]
  } {
    const { alt, ast, bilirubin } = liverFunction
    const { creatinine, egfr } = kidneyFunction
    let liverStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment' = 'normal'
    if (alt > 120 || ast > 120 || bilirubin > 3) {
      liverStatus = 'severe-impairment'
    } else if (alt > 80 || ast > 80 || bilirubin > 2) {
      liverStatus = 'moderate-impairment'
    } else if (alt > 40 || ast > 40 || bilirubin > 1.5) {
      liverStatus = 'mild-impairment'
    }
    let kidneyStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment' = 'normal'
    if (egfr < 30 || creatinine > 3) {
      kidneyStatus = 'severe-impairment'
    } else if (egfr < 60 || creatinine > 2) {
      kidneyStatus = 'moderate-impairment'
    } else if (egfr < 90 || creatinine > 1.5) {
      kidneyStatus = 'mild-impairment'
    }
    const doseAdjustmentsRequired: string[] = []
    const contraindicatedMedications: string[] = []
    const monitoringRequirements: string[] = []
    if (liverStatus !== 'normal') {
      doseAdjustmentsRequired.push('Consider dose reduction for hepatically metabolized drugs')
      monitoringRequirements.push('Weekly liver function monitoring')
      if (liverStatus === 'severe-impairment') {
        contraindicatedMedications.push('Nevirapine')
        monitoringRequirements.push('Consider hepatology consultation')
      }
    }
    if (kidneyStatus !== 'normal') {
      doseAdjustmentsRequired.push('Adjust doses for renally eliminated drugs')
      monitoringRequirements.push('Weekly kidney function monitoring')
      if (kidneyStatus === 'severe-impairment') {
        doseAdjustmentsRequired.push('Reduce tenofovir dose by 50%')
        monitoringRequirements.push('Consider nephrology consultation')
      }
    }
    return {
      liverStatus,
      kidneyStatus,
      doseAdjustmentsRequired,
      contraindicatedMedications,
      monitoringRequirements,
    }
  }
}
