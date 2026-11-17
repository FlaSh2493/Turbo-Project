interface ValidateRangeOptions {
  min: string
  max: string
  minValue?: number
  maxValue?: number
}

interface ValidateRangeResult {
  minInvalid: boolean
  maxInvalid: boolean
}

export const validateRange = ({
  min,
  max,
  minValue,
  maxValue,
}: ValidateRangeOptions): ValidateRangeResult => {
  const minNum = min === '' ? null : Number(min)
  const maxNum = max === '' ? null : Number(max)
  const minNaN = minNum !== null && !Number.isFinite(minNum)
  const maxNaN = maxNum !== null && !Number.isFinite(maxNum)
  const isReversed = minNum !== null && maxNum !== null && minNum > maxNum

  const minInvalid =
    minNaN ||
    (minNum !== null && minValue !== undefined && minNum < minValue) ||
    (minNum !== null && maxValue !== undefined && minNum > maxValue) ||
    isReversed

  const maxInvalid =
    maxNaN ||
    (maxNum !== null && minValue !== undefined && maxNum < minValue) ||
    (maxNum !== null && maxValue !== undefined && maxNum > maxValue) ||
    isReversed

  return { minInvalid, maxInvalid }
}
