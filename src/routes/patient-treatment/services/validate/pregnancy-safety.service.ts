export class PregnancySafetyService {
  validatePregnancySafety(
    patientGender: 'male' | 'female' | 'other',
    isPregnant: boolean,
    isBreastfeeding: boolean,
    protocolId: number,
  ): {
    isSafe: boolean
    pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A'
    contraindicatedMedications: string[]
    alternativeRecommendations: string[]
    monitoringRequirements: string[]
  } {
    let pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A' = 'N/A'
    const contraindicatedMedications: string[] = []
    const alternativeRecommendations: string[] = []
    const monitoringRequirements: string[] = []

    if (patientGender !== 'female') {
      pregnancyCategory = 'N/A'
      return {
        isSafe: true,
        pregnancyCategory,
        contraindicatedMedications,
        alternativeRecommendations,
        monitoringRequirements: ['Standard monitoring applies'],
      }
    }

    if (isPregnant || isBreastfeeding) {
      pregnancyCategory = 'B'
      if (protocolId === 1) {
        contraindicatedMedications.push('Efavirenz')
        alternativeRecommendations.push('Switch to integrase inhibitor-based regimen')
      }
      if (isPregnant) {
        monitoringRequirements.push('Monthly viral load monitoring')
        monitoringRequirements.push('Obstetric consultation')
        monitoringRequirements.push('Fetal development monitoring')
      }
      if (isBreastfeeding) {
        monitoringRequirements.push('Infant HIV testing at 6 weeks, 3 months, 6 months')
        monitoringRequirements.push('Monitor for medication side effects in infant')
      }
    }
    const isSafe = contraindicatedMedications.length === 0
    return {
      isSafe,
      pregnancyCategory,
      contraindicatedMedications,
      alternativeRecommendations,
      monitoringRequirements,
    }
  }
}
