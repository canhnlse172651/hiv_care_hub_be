export class ResistancePatternService {
  validateResistancePattern(
    resistanceData: {
      mutations: string[]
      resistanceLevel: 'none' | 'low' | 'intermediate' | 'high'
      previousFailedRegimens: string[]
    },
    proposedProtocolId: number,
  ): {
    isEffective: boolean
    effectivenessScore: number
    resistantMedications: string[]
    recommendedAlternatives: string[]
    requiresGenotyping: boolean
  } {
    const { mutations, resistanceLevel, previousFailedRegimens } = resistanceData
    const resistantMedications: string[] = []
    const recommendedAlternatives: string[] = []
    if (mutations.includes('M184V')) {
      resistantMedications.push('Lamivudine', 'Emtricitabine')
    }
    if (mutations.includes('K103N')) {
      resistantMedications.push('Efavirenz', 'Nevirapine')
    }
    if (mutations.includes('Q148H')) {
      resistantMedications.push('Raltegravir', 'Elvitegravir')
    }
    let effectivenessScore = 100
    if (resistanceLevel === 'high') effectivenessScore -= 60
    else if (resistanceLevel === 'intermediate') effectivenessScore -= 40
    else if (resistanceLevel === 'low') effectivenessScore -= 20
    effectivenessScore -= resistantMedications.length * 15
    effectivenessScore -= previousFailedRegimens.length * 10
    const isEffective = effectivenessScore >= 70
    const requiresGenotyping = resistanceLevel !== 'none' || previousFailedRegimens.length > 0
    if (!isEffective) {
      recommendedAlternatives.push('Consider second-line regimen with integrase inhibitor')
      recommendedAlternatives.push('Evaluate for newer agents (bictegravir, cabotegravir)')
    }
    return {
      isEffective,
      effectivenessScore: Math.max(0, effectivenessScore),
      resistantMedications,
      recommendedAlternatives,
      requiresGenotyping,
    }
  }
}
