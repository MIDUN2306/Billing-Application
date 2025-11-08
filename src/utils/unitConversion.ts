/**
 * Unit Conversion Utilities
 * Handles conversion between different units for display and calculations
 */

export interface ConversionResult {
  value: number;
  unit: string;
  displayText: string;
}

/**
 * Convert liters to milliliters
 */
export function litersToMilliliters(liters: number): number {
  return liters * 1000;
}

/**
 * Convert milliliters to liters
 */
export function millilitersToLiters(milliliters: number): number {
  return milliliters / 1000;
}

/**
 * Convert kilograms to grams
 */
export function kilogramsToGrams(kilograms: number): number {
  return kilograms * 1000;
}

/**
 * Convert grams to kilograms
 */
export function gramsToKilograms(grams: number): number {
  return grams / 1000;
}

/**
 * Smart display for volume - shows in ml if less than 1L, otherwise in L
 */
export function formatVolume(value: number, unit: string): ConversionResult {
  const normalizedUnit = unit.toLowerCase();
  
  if (normalizedUnit === 'l' || normalizedUnit === 'ltr' || normalizedUnit === 'litre' || normalizedUnit === 'liter') {
    const ml = litersToMilliliters(value);
    
    if (value < 1) {
      // Show in ml if less than 1 liter
      return {
        value: ml,
        unit: 'ml',
        displayText: `${ml.toFixed(0)} ml`
      };
    } else {
      // Show both L and ml
      return {
        value: value,
        unit: 'L',
        displayText: `${value.toFixed(2)} L (${ml.toFixed(0)} ml)`
      };
    }
  }
  
  if (normalizedUnit === 'ml' || normalizedUnit === 'milliliter' || normalizedUnit === 'millilitre') {
    if (value >= 1000) {
      // Show in liters if >= 1000ml
      const liters = millilitersToLiters(value);
      return {
        value: liters,
        unit: 'L',
        displayText: `${liters.toFixed(2)} L (${value.toFixed(0)} ml)`
      };
    } else {
      return {
        value: value,
        unit: 'ml',
        displayText: `${value.toFixed(0)} ml`
      };
    }
  }
  
  // Return as-is for other units
  return {
    value: value,
    unit: unit,
    displayText: `${value.toFixed(2)} ${unit}`
  };
}

/**
 * Smart display for weight - shows in g if less than 1kg, otherwise in kg
 */
export function formatWeight(value: number, unit: string): ConversionResult {
  const normalizedUnit = unit.toLowerCase();
  
  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogram') {
    const grams = kilogramsToGrams(value);
    
    if (value < 1) {
      // Show in grams if less than 1 kg
      return {
        value: grams,
        unit: 'g',
        displayText: `${grams.toFixed(0)} g`
      };
    } else {
      // Show both kg and g
      return {
        value: value,
        unit: 'kg',
        displayText: `${value.toFixed(2)} kg (${grams.toFixed(0)} g)`
      };
    }
  }
  
  if (normalizedUnit === 'g' || normalizedUnit === 'gram' || normalizedUnit === 'gm') {
    if (value >= 1000) {
      // Show in kg if >= 1000g
      const kg = gramsToKilograms(value);
      return {
        value: kg,
        unit: 'kg',
        displayText: `${kg.toFixed(2)} kg (${value.toFixed(0)} g)`
      };
    } else {
      return {
        value: value,
        unit: 'g',
        displayText: `${value.toFixed(0)} g`
      };
    }
  }
  
  // Return as-is for other units
  return {
    value: value,
    unit: unit,
    displayText: `${value.toFixed(2)} ${unit}`
  };
}

/**
 * Smart display for any quantity - automatically detects unit type
 */
export function formatQuantity(value: number, unit: string): ConversionResult {
  const normalizedUnit = unit.toLowerCase();
  
  // Volume units
  if (['l', 'ltr', 'litre', 'liter', 'ml', 'milliliter', 'millilitre'].includes(normalizedUnit)) {
    return formatVolume(value, unit);
  }
  
  // Weight units
  if (['kg', 'kilogram', 'g', 'gram', 'gm'].includes(normalizedUnit)) {
    return formatWeight(value, unit);
  }
  
  // Other units - return as-is
  return {
    value: value,
    unit: unit,
    displayText: `${value.toFixed(2)} ${unit}`
  };
}

/**
 * Get the base unit for a given unit (for calculations)
 */
export function getBaseUnit(unit: string): string {
  const normalizedUnit = unit.toLowerCase();
  
  // Volume
  if (['l', 'ltr', 'litre', 'liter'].includes(normalizedUnit)) return 'L';
  if (['ml', 'milliliter', 'millilitre'].includes(normalizedUnit)) return 'ml';
  
  // Weight
  if (['kg', 'kilogram'].includes(normalizedUnit)) return 'kg';
  if (['g', 'gram', 'gm'].includes(normalizedUnit)) return 'g';
  
  // Return original if not recognized
  return unit;
}

/**
 * Convert value to base unit for calculations
 */
export function toBaseUnit(value: number, fromUnit: string, toUnit: string): number {
  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();
  
  // Same unit, no conversion needed
  if (normalizedFrom === normalizedTo) return value;
  
  // Liter to ml
  if ((normalizedFrom === 'l' || normalizedFrom === 'ltr') && normalizedTo === 'ml') {
    return litersToMilliliters(value);
  }
  
  // ml to Liter
  if (normalizedFrom === 'ml' && (normalizedTo === 'l' || normalizedTo === 'ltr')) {
    return millilitersToLiters(value);
  }
  
  // kg to g
  if (normalizedFrom === 'kg' && (normalizedTo === 'g' || normalizedTo === 'gm')) {
    return kilogramsToGrams(value);
  }
  
  // g to kg
  if ((normalizedFrom === 'g' || normalizedFrom === 'gm') && normalizedTo === 'kg') {
    return gramsToKilograms(value);
  }
  
  // No conversion available, return original
  return value;
}
