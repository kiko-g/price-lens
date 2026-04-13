import { describe, expect, it } from "vitest"
import { calculateNameSimilarity, extractWords } from "@/lib/canonical/similarity"

describe("extractWords", () => {
  it("keeps digit tokens so formula stages differ", () => {
    expect(extractWords("Leite em Pó Aptamil 1")).toContain("1")
    expect(extractWords("Leite em Pó Aptamil 2")).toContain("2")
  })

  it("keeps digits in tipo N variants", () => {
    expect(extractWords("Iogurte tipo 3")).toContain("3")
    expect(extractWords("Iogurte tipo 4")).toContain("4")
  })
})

describe("calculateNameSimilarity", () => {
  it("scores Aptamil 1 vs Aptamil 2 much lower than same-stage strings", () => {
    const diffStage = calculateNameSimilarity("Aptamil 1", "Aptamil 2")
    const sameStage = calculateNameSimilarity("Aptamil 2 x", "Aptamil 2 y")
    expect(diffStage.similarity).toBeLessThan(sameStage.similarity)
    expect(diffStage.similarity).toBeLessThan(0.75)
  })

  it("scores tipo 3 vs tipo 4 lower than same tipo", () => {
    const diffTipo = calculateNameSimilarity("Iogurte grego tipo 3", "Iogurte grego tipo 4")
    const sameTipo = calculateNameSimilarity("Iogurte grego tipo 3", "Iogurte grego tipo 3 magro")
    expect(diffTipo.similarity).toBeLessThan(sameTipo.similarity)
  })
})
