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

    // Map mutations to resistant medications
    const mutationMap: Record<string, string[]> = {
      M184V: ['Lamivudine', 'Emtricitabine'],
      K103N: ['Efavirenz', 'Nevirapine'],
      Q148H: ['Raltegravir', 'Elvitegravir'],
    }
    for (const mutation of mutations) {
      if (mutationMap[mutation]) {
        resistantMedications.push(...mutationMap[mutation])
      }
    }

    // Calculate effectiveness score
    let effectivenessScore = 100
    switch (resistanceLevel) {
      case 'high':
        effectivenessScore -= 60
        break
      case 'intermediate':
        effectivenessScore -= 40
        break
      case 'low':
        effectivenessScore -= 20
        break
    }
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
