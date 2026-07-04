// ⚠️ AUTO-GENERATED từ content/questions/*.json — KHÔNG sửa tay (npm run sync:edge). Đáp án chấm server (D4/D6/D13).
import type { QuestionType } from "./grading-engine.ts";
export interface AnswerKey { type: QuestionType | "derivation"; correct: string | string[]; tolerance?: number; unordered?: boolean; roundTo?: number }
export const ANSWER_KEYS: Record<string, AnswerKey> = {
  "g1.num.addsub.q001": {
    "type": "numeric",
    "correct": "5"
  },
  "g1.num.addsub.q002": {
    "type": "numeric",
    "correct": "3"
  },
  "g1.num.addsub.q003": {
    "type": "mcq",
    "correct": "9"
  },
  "g1.num.addsub.q004": {
    "type": "numeric",
    "correct": "9"
  },
  "g1.num.addsub.q005": {
    "type": "numeric",
    "correct": "5"
  },
  "g1.num.addsub.q006": {
    "type": "numeric",
    "correct": "8"
  },
  "g1.num.addsub.q007": {
    "type": "mcq",
    "correct": "3"
  },
  "g1.num.addsub.q008": {
    "type": "true-false",
    "correct": "true"
  },
  "g1.num.addsub.q009": {
    "type": "numeric",
    "correct": "4"
  },
  "g1.num.addsub.q010": {
    "type": "numeric",
    "correct": "7"
  },
  "g2.num.mult.q001": {
    "type": "numeric",
    "correct": "6"
  },
  "g2.num.mult.q002": {
    "type": "mcq",
    "correct": "20"
  },
  "g2.num.mult.q003": {
    "type": "numeric",
    "correct": "25"
  },
  "g2.num.mult.q004": {
    "type": "true-false",
    "correct": "true"
  },
  "g2.num.mult.q005": {
    "type": "numeric",
    "correct": "12"
  },
  "g2.num.mult.q006": {
    "type": "numeric",
    "correct": "14"
  },
  "g2.num.mult.q007": {
    "type": "mcq",
    "correct": "24"
  },
  "g2.num.mult.q008": {
    "type": "numeric",
    "correct": "24"
  },
  "g2.num.mult.q009": {
    "type": "true-false",
    "correct": "true"
  },
  "g2.num.mult.q010": {
    "type": "numeric",
    "correct": "12"
  },
  "g3.num.muldiv.q001": {
    "type": "numeric",
    "correct": "42"
  },
  "g3.num.muldiv.q002": {
    "type": "numeric",
    "correct": "4"
  },
  "g3.num.muldiv.q003": {
    "type": "mcq",
    "correct": "32"
  },
  "g3.num.muldiv.q004": {
    "type": "numeric",
    "correct": "56"
  },
  "g3.num.muldiv.q005": {
    "type": "numeric",
    "correct": "8"
  },
  "g3.num.muldiv.q006": {
    "type": "numeric",
    "correct": "54"
  },
  "g3.num.muldiv.q007": {
    "type": "mcq",
    "correct": "8"
  },
  "g3.num.muldiv.q008": {
    "type": "numeric",
    "correct": "64"
  },
  "g3.num.muldiv.q009": {
    "type": "true-false",
    "correct": "true"
  },
  "g3.num.muldiv.q010": {
    "type": "numeric",
    "correct": "9"
  },
  "g4.geo.area.q001": {
    "type": "numeric",
    "correct": "15"
  },
  "g4.geo.perimeter.q001": {
    "type": "numeric",
    "correct": "16"
  },
  "g4.geo.area.q002": {
    "type": "mcq",
    "correct": "16 cm²"
  },
  "g4.geo.perimeter.q002": {
    "type": "numeric",
    "correct": "26"
  },
  "g4.geo.perimeter.q003": {
    "type": "numeric",
    "correct": "38"
  },
  "g4.geo.perimeter.q004": {
    "type": "numeric",
    "correct": "24"
  },
  "g4.geo.perimeter.q005": {
    "type": "mcq",
    "correct": "28"
  },
  "g4.geo.perimeter.q006": {
    "type": "true-false",
    "correct": "true"
  },
  "g4.geo.perimeter.q007": {
    "type": "numeric",
    "correct": "48"
  },
  "g4.geo.perimeter.q008": {
    "type": "numeric",
    "correct": "66"
  },
  "g4.geo.perimeter.q009": {
    "type": "numeric",
    "correct": "36"
  },
  "g4.geo.perimeter.q010": {
    "type": "numeric",
    "correct": "80"
  },
  "g4.geo.area.q003": {
    "type": "numeric",
    "correct": "40"
  },
  "g4.geo.area.q004": {
    "type": "numeric",
    "correct": "84"
  },
  "g4.geo.area.q005": {
    "type": "numeric",
    "correct": "36"
  },
  "g4.geo.area.q006": {
    "type": "mcq",
    "correct": "40"
  },
  "g4.geo.area.q007": {
    "type": "true-false",
    "correct": "true"
  },
  "g4.geo.area.q008": {
    "type": "numeric",
    "correct": "36"
  },
  "g4.geo.area.q009": {
    "type": "numeric",
    "correct": "90"
  },
  "g4.geo.area.q010": {
    "type": "numeric",
    "correct": "64"
  },
  "g4.num.arithmetic.q001": {
    "type": "numeric",
    "correct": "6245"
  },
  "g4.num.arithmetic.q002": {
    "type": "numeric",
    "correct": "4655"
  },
  "g4.num.arithmetic.q003": {
    "type": "numeric",
    "correct": "6550"
  },
  "g4.num.arithmetic.q004": {
    "type": "numeric",
    "correct": "7766"
  },
  "g4.num.arithmetic.q005": {
    "type": "mcq",
    "correct": "2500"
  },
  "g4.num.arithmetic.q006": {
    "type": "true-false",
    "correct": "true"
  },
  "g4.num.arithmetic.q007": {
    "type": "numeric",
    "correct": "470"
  },
  "g4.num.arithmetic.q008": {
    "type": "numeric",
    "correct": "61"
  },
  "g4.num.arithmetic.q009": {
    "type": "numeric",
    "correct": "19134"
  },
  "g4.num.arithmetic.q010": {
    "type": "numeric",
    "correct": "6433"
  },
  "g4.num.arithmetic.q011": {
    "type": "numeric",
    "correct": "1170"
  },
  "g4.num.arithmetic.q012": {
    "type": "numeric",
    "correct": "7404"
  },
  "g4.num.arithmetic.q013": {
    "type": "numeric",
    "correct": "965"
  },
  "g4.num.arithmetic.q014": {
    "type": "numeric",
    "correct": "234"
  },
  "g4.num.arithmetic.q015": {
    "type": "mcq",
    "correct": "1000"
  },
  "g4.num.arithmetic.q016": {
    "type": "true-false",
    "correct": "false"
  },
  "g4.num.arithmetic.q017": {
    "type": "numeric",
    "correct": "144"
  },
  "g4.num.arithmetic.q018": {
    "type": "numeric",
    "correct": "42"
  },
  "g4.num.arithmetic.q019": {
    "type": "numeric",
    "correct": "2856"
  },
  "g4.num.arithmetic.q020": {
    "type": "numeric",
    "correct": "750"
  },
  "g4.num.fractions.q001": {
    "type": "mcq",
    "correct": "1/2"
  },
  "g4.num.fractions.q002": {
    "type": "true-false",
    "correct": "true"
  },
  "g4.num.fractions.q003": {
    "type": "numeric",
    "correct": "0.5"
  },
  "g4.num.fractions.q004": {
    "type": "fraction",
    "correct": "1/2"
  },
  "g4.num.fractions.q005": {
    "type": "fraction",
    "correct": "1/2"
  },
  "g4.num.fractions.q006": {
    "type": "fill-blank",
    "correct": [
      "1",
      "1/2"
    ]
  },
  "g4.num.fractions.q007": {
    "type": "mcq",
    "correct": "2/4"
  },
  "g4.num.fractions.q008": {
    "type": "true-false",
    "correct": "false"
  },
  "g4.num.fractions.q009": {
    "type": "mcq",
    "correct": "3"
  },
  "g4.num.fractions.q010": {
    "type": "mcq",
    "correct": "8"
  },
  "g4.num.fractions.q011": {
    "type": "true-false",
    "correct": "true"
  },
  "g4.num.fractions.q012": {
    "type": "mcq",
    "correct": "1/4"
  },
  "g4.num.fractions.q013": {
    "type": "fraction",
    "correct": "3/5"
  },
  "g4.num.fractions.q014": {
    "type": "mcq",
    "correct": "2/6"
  },
  "g4.num.fractions.q015": {
    "type": "true-false",
    "correct": "true"
  },
  "g4.num.fractions.q016": {
    "type": "numeric",
    "correct": "7"
  },
  "g4.num.fractions.q017": {
    "type": "fraction",
    "correct": "1/2"
  },
  "g4.num.fractions.q018": {
    "type": "fraction",
    "correct": "2/3"
  },
  "g4.num.fractions.q019": {
    "type": "mcq",
    "correct": "3/5"
  },
  "g4.num.fractions.q020": {
    "type": "true-false",
    "correct": "true"
  },
  "g4.num.fractions.q021": {
    "type": "mcq",
    "correct": "3/4"
  },
  "g4.num.fractions.q022": {
    "type": "fraction",
    "correct": "2/3"
  },
  "g4.num.fractions.q023": {
    "type": "fraction",
    "correct": "3/5"
  },
  "g4.num.fractions.q024": {
    "type": "fraction",
    "correct": "5/7"
  },
  "g4.num.fractions.q025": {
    "type": "fraction",
    "correct": "3/9"
  },
  "g4.num.fractions.q026": {
    "type": "fraction",
    "correct": "2/8"
  },
  "g4.num.fractions.q027": {
    "type": "fraction",
    "correct": "5/6"
  },
  "g4.num.fractions.q028": {
    "type": "fraction",
    "correct": "3/10"
  },
  "g4.num.fractions.q029": {
    "type": "mcq",
    "correct": "3/4"
  },
  "g4.num.fractions.q030": {
    "type": "fill-blank",
    "correct": [
      "3/5",
      "2/6"
    ]
  },
  "g5.geo.area.q001": {
    "type": "numeric",
    "correct": "12"
  },
  "g5.geo.area.q002": {
    "type": "numeric",
    "correct": "25"
  },
  "g5.geo.area.q003": {
    "type": "numeric",
    "correct": "30"
  },
  "g5.geo.area.q004": {
    "type": "numeric",
    "correct": "12"
  },
  "g5.geo.area.q005": {
    "type": "numeric",
    "correct": "32"
  },
  "g5.geo.area.q006": {
    "type": "numeric",
    "correct": "30"
  },
  "g5.geo.area.q007": {
    "type": "mcq",
    "correct": "8"
  },
  "g5.geo.area.q008": {
    "type": "numeric",
    "correct": "30"
  },
  "g5.geo.area.q009": {
    "type": "numeric",
    "correct": "27"
  },
  "g5.geo.area.q010": {
    "type": "numeric",
    "correct": "100"
  },
  "g5.geo.volume.q001": {
    "type": "numeric",
    "correct": "24"
  },
  "g5.geo.volume.q002": {
    "type": "numeric",
    "correct": "30"
  },
  "g5.geo.volume.q003": {
    "type": "numeric",
    "correct": "27"
  },
  "g5.geo.volume.q004": {
    "type": "numeric",
    "correct": "32"
  },
  "g5.geo.volume.q005": {
    "type": "numeric",
    "correct": "60"
  },
  "g5.geo.volume.q006": {
    "type": "mcq",
    "correct": "8"
  },
  "g5.geo.volume.q007": {
    "type": "numeric",
    "correct": "60"
  },
  "g5.geo.volume.q008": {
    "type": "numeric",
    "correct": "64"
  },
  "g5.geo.volume.q009": {
    "type": "numeric",
    "correct": "27"
  },
  "g5.geo.volume.q010": {
    "type": "numeric",
    "correct": "50"
  },
  "g5.num.decimal.q001": {
    "type": "true-false",
    "correct": "true"
  },
  "g5.num.decimal.q002": {
    "type": "mcq",
    "correct": "3,7"
  },
  "g5.num.decimal.q003": {
    "type": "numeric",
    "correct": "0,7"
  },
  "g5.num.decimal.q004": {
    "type": "mcq",
    "correct": "1/2"
  },
  "g5.num.decimal.q005": {
    "type": "true-false",
    "correct": "true"
  },
  "g5.num.decimal.q006": {
    "type": "mcq",
    "correct": "2"
  },
  "g5.num.decimal.q007": {
    "type": "numeric",
    "correct": "0,03"
  },
  "g5.num.decimal.q008": {
    "type": "mcq",
    "correct": "6,08"
  },
  "g5.num.decimal.q009": {
    "type": "true-false",
    "correct": "true"
  },
  "g5.num.decimal.q010": {
    "type": "numeric",
    "correct": "0,25"
  },
  "g5.num.decimal.q011": {
    "type": "numeric",
    "correct": "6,2"
  },
  "g5.num.decimal.q012": {
    "type": "numeric",
    "correct": "3,7"
  },
  "g5.num.decimal.q013": {
    "type": "numeric",
    "correct": "20"
  },
  "g5.num.decimal.q014": {
    "type": "numeric",
    "correct": "6,6"
  },
  "g5.num.decimal.q015": {
    "type": "numeric",
    "correct": "10"
  },
  "g5.num.decimal.q016": {
    "type": "numeric",
    "correct": "5,45"
  },
  "g5.num.decimal.q017": {
    "type": "numeric",
    "correct": "4,25"
  },
  "g5.num.decimal.q018": {
    "type": "numeric",
    "correct": "0,75"
  },
  "g5.num.decimal.q019": {
    "type": "numeric",
    "correct": "10"
  },
  "g5.num.decimal.q020": {
    "type": "numeric",
    "correct": "4,55"
  },
  "g5.num.decimal.q021": {
    "type": "numeric",
    "correct": "10"
  },
  "g5.num.decimal.q022": {
    "type": "numeric",
    "correct": "3,6"
  },
  "g5.num.decimal.q023": {
    "type": "numeric",
    "correct": "1,5"
  },
  "g5.num.decimal.q024": {
    "type": "numeric",
    "correct": "2,4"
  },
  "g5.num.decimal.q025": {
    "type": "numeric",
    "correct": "3"
  },
  "g5.num.decimal.q026": {
    "type": "numeric",
    "correct": "8"
  },
  "g5.num.decimal.q027": {
    "type": "numeric",
    "correct": "6,25"
  },
  "g5.num.decimal.q028": {
    "type": "numeric",
    "correct": "7,5"
  },
  "g5.num.decimal.q029": {
    "type": "numeric",
    "correct": "1,6"
  },
  "g5.num.decimal.q030": {
    "type": "numeric",
    "correct": "6,25"
  },
  "g5.num.percent.q001": {
    "type": "numeric",
    "correct": "50"
  },
  "g5.num.percent.q002": {
    "type": "numeric",
    "correct": "8"
  },
  "g5.num.percent.q003": {
    "type": "numeric",
    "correct": "60"
  },
  "g5.num.percent.q004": {
    "type": "mcq",
    "correct": "50%"
  },
  "g5.num.percent.q005": {
    "type": "numeric",
    "correct": "10"
  },
  "g5.num.percent.q006": {
    "type": "numeric",
    "correct": "10"
  },
  "g5.num.percent.q007": {
    "type": "numeric",
    "correct": "75"
  },
  "g5.num.percent.q008": {
    "type": "numeric",
    "correct": "45"
  },
  "g5.num.percent.q009": {
    "type": "mcq",
    "correct": "75%"
  },
  "g5.num.percent.q010": {
    "type": "numeric",
    "correct": "10"
  },
  "g6.geo.plane.q001": {
    "type": "mcq",
    "correct": "Lục giác đều"
  },
  "g6.geo.plane.q002": {
    "type": "true-false",
    "correct": "true"
  },
  "g6.geo.plane.q003": {
    "type": "mcq",
    "correct": "Hình thoi"
  },
  "g6.geo.plane.q004": {
    "type": "true-false",
    "correct": "true"
  },
  "g6.geo.plane.q005": {
    "type": "mcq",
    "correct": "2"
  },
  "g6.geo.plane.q006": {
    "type": "true-false",
    "correct": "true"
  },
  "g6.geo.plane.q007": {
    "type": "numeric",
    "correct": "20"
  },
  "g6.geo.plane.q008": {
    "type": "numeric",
    "correct": "20"
  },
  "g6.geo.plane.q009": {
    "type": "numeric",
    "correct": "21"
  },
  "g6.geo.plane.q010": {
    "type": "numeric",
    "correct": "36"
  },
  "g6.geo.plane.q011": {
    "type": "numeric",
    "correct": "22"
  },
  "g6.geo.plane.q012": {
    "type": "numeric",
    "correct": "24"
  },
  "g6.geo.plane.q013": {
    "type": "numeric",
    "correct": "25"
  },
  "g6.geo.plane.q014": {
    "type": "numeric",
    "correct": "24"
  },
  "g6.geo.plane.q015": {
    "type": "numeric",
    "correct": "24"
  },
  "g6.geo.plane.q016": {
    "type": "numeric",
    "correct": "24"
  },
  "g6.geo.plane.q017": {
    "type": "numeric",
    "correct": "32"
  },
  "g6.num.decimals.q001": {
    "type": "numeric",
    "correct": "-2,5"
  },
  "g6.num.decimals.q002": {
    "type": "mcq",
    "correct": "-1,2"
  },
  "g6.num.decimals.q003": {
    "type": "true-false",
    "correct": "true"
  },
  "g6.num.decimals.q004": {
    "type": "numeric",
    "correct": "3,46"
  },
  "g6.num.decimals.q005": {
    "type": "numeric",
    "correct": "13"
  },
  "g6.num.decimals.q006": {
    "type": "numeric",
    "correct": "3,8"
  },
  "g6.num.decimals.q007": {
    "type": "numeric",
    "correct": "3,8"
  },
  "g6.num.decimals.q008": {
    "type": "numeric",
    "correct": "3,5"
  },
  "g6.num.decimals.q009": {
    "type": "numeric",
    "correct": "-1"
  },
  "g6.num.decimals.q010": {
    "type": "numeric",
    "correct": "-2,5"
  },
  "g6.num.decimals.q011": {
    "type": "numeric",
    "correct": "-3,8"
  },
  "g6.num.decimals.q012": {
    "type": "numeric",
    "correct": "-2,3"
  },
  "g6.num.decimals.q013": {
    "type": "numeric",
    "correct": "10"
  },
  "g6.num.decimals.q014": {
    "type": "numeric",
    "correct": "-4,5"
  },
  "g6.num.decimals.q015": {
    "type": "numeric",
    "correct": "3,2"
  },
  "g6.num.decimals.q016": {
    "type": "numeric",
    "correct": "4"
  },
  "g6.num.decimals.q017": {
    "type": "numeric",
    "correct": "-4"
  },
  "g6.num.fractions.q001": {
    "type": "fraction",
    "correct": "3/4"
  },
  "g6.num.fractions.q002": {
    "type": "fraction",
    "correct": "3/5"
  },
  "g6.num.fractions.q003": {
    "type": "fraction",
    "correct": "-2/3"
  },
  "g6.num.fractions.q004": {
    "type": "mcq",
    "correct": "2/4"
  },
  "g6.num.fractions.q005": {
    "type": "mcq",
    "correct": "3/4"
  },
  "g6.num.fractions.q006": {
    "type": "true-false",
    "correct": "true"
  },
  "g6.num.fractions.q007": {
    "type": "fraction",
    "correct": "1/2"
  },
  "g6.num.fractions.q008": {
    "type": "fraction",
    "correct": "5/6"
  },
  "g6.num.fractions.q009": {
    "type": "fraction",
    "correct": "1/4"
  },
  "g6.num.fractions.q010": {
    "type": "fraction",
    "correct": "1/6"
  },
  "g6.num.fractions.q011": {
    "type": "fraction",
    "correct": "-1/2"
  },
  "g6.num.fractions.q012": {
    "type": "fraction",
    "correct": "1/2"
  },
  "g6.num.fractions.q013": {
    "type": "fraction",
    "correct": "1/2"
  },
  "g6.num.fractions.q014": {
    "type": "numeric",
    "correct": "6"
  },
  "g6.num.fractions.q015": {
    "type": "numeric",
    "correct": "2"
  },
  "g6.num.fractions.q016": {
    "type": "fraction",
    "correct": "-2/5"
  },
  "g6.num.fractions.q017": {
    "type": "fraction",
    "correct": "5/2"
  },
  "g6.num.integers.q001": {
    "type": "numeric",
    "correct": "9"
  },
  "g6.num.integers.q002": {
    "type": "numeric",
    "correct": "-15"
  },
  "g6.num.integers.q003": {
    "type": "mcq",
    "correct": "-3"
  },
  "g6.num.integers.q004": {
    "type": "true-false",
    "correct": "true"
  },
  "g6.num.integers.q005": {
    "type": "numeric",
    "correct": "7"
  },
  "g6.num.integers.q006": {
    "type": "numeric",
    "correct": "-4"
  },
  "g6.num.integers.q007": {
    "type": "numeric",
    "correct": "-13"
  },
  "g6.num.integers.q008": {
    "type": "numeric",
    "correct": "-4"
  },
  "g6.num.integers.q009": {
    "type": "numeric",
    "correct": "4"
  },
  "g6.num.integers.q010": {
    "type": "numeric",
    "correct": "-8"
  },
  "g6.num.integers.q011": {
    "type": "numeric",
    "correct": "-22"
  },
  "g6.num.integers.q012": {
    "type": "numeric",
    "correct": "-24"
  },
  "g6.num.integers.q013": {
    "type": "numeric",
    "correct": "35"
  },
  "g6.num.integers.q014": {
    "type": "numeric",
    "correct": "-24"
  },
  "g6.num.integers.q015": {
    "type": "numeric",
    "correct": "-4"
  },
  "g6.num.integers.q016": {
    "type": "numeric",
    "correct": "8"
  },
  "g6.num.integers.q017": {
    "type": "numeric",
    "correct": "-6"
  },
  "g6.num.naturals.q001": {
    "type": "numeric",
    "correct": "8"
  },
  "g6.num.naturals.q002": {
    "type": "numeric",
    "correct": "25"
  },
  "g6.num.naturals.q003": {
    "type": "numeric",
    "correct": "1000"
  },
  "g6.num.naturals.q004": {
    "type": "numeric",
    "correct": "14"
  },
  "g6.num.naturals.q005": {
    "type": "numeric",
    "correct": "20"
  },
  "g6.num.naturals.q006": {
    "type": "numeric",
    "correct": "17"
  },
  "g6.num.naturals.q007": {
    "type": "mcq",
    "correct": "126"
  },
  "g6.num.naturals.q008": {
    "type": "true-false",
    "correct": "true"
  },
  "g6.num.naturals.q009": {
    "type": "mcq",
    "correct": "17"
  },
  "g6.num.naturals.q010": {
    "type": "true-false",
    "correct": "false"
  },
  "g6.num.naturals.q011": {
    "type": "mcq",
    "correct": "30"
  },
  "g6.num.naturals.q012": {
    "type": "mcq",
    "correct": "15"
  },
  "g6.num.naturals.q013": {
    "type": "numeric",
    "correct": "6"
  },
  "g6.num.naturals.q014": {
    "type": "numeric",
    "correct": "12"
  },
  "g6.num.naturals.q015": {
    "type": "numeric",
    "correct": "12"
  },
  "g6.num.naturals.q016": {
    "type": "numeric",
    "correct": "15"
  },
  "g6.num.naturals.q017": {
    "type": "numeric",
    "correct": "5"
  },
  "tv.g1.chinhta.q001": {
    "type": "mcq",
    "correct": "kẻ"
  },
  "tv.g1.chinhta.q002": {
    "type": "mcq",
    "correct": "con cá"
  },
  "tv.g1.chinhta.q003": {
    "type": "mcq",
    "correct": "ghế"
  },
  "tv.g1.chinhta.q004": {
    "type": "mcq",
    "correct": "cái gối"
  },
  "tv.g1.chinhta.q005": {
    "type": "mcq",
    "correct": "nghe"
  },
  "tv.g1.chinhta.q006": {
    "type": "mcq",
    "correct": "ngôi nhà"
  },
  "tv.g1.chinhta.q007": {
    "type": "true-false",
    "correct": "true"
  },
  "tv.g1.daucau.q001": {
    "type": "mcq",
    "correct": "dấu chấm (.)"
  },
  "tv.g1.daucau.q002": {
    "type": "mcq",
    "correct": "dấu hỏi (?)"
  },
  "tv.g1.daucau.q003": {
    "type": "true-false",
    "correct": "false"
  },
  "tv.g1.daucau.q004": {
    "type": "mcq",
    "correct": "!"
  },
  "tv.g1.daucau.q005": {
    "type": "mcq",
    "correct": "?"
  },
  "tv.g1.daucau.q006": {
    "type": "true-false",
    "correct": "true"
  },
  "tv.g1.daucau.q007": {
    "type": "mcq",
    "correct": "câu kể"
  },
  "tv.g1.tuloai.q001": {
    "type": "mcq",
    "correct": "cái bàn"
  },
  "tv.g1.tuloai.q002": {
    "type": "mcq",
    "correct": "đọc"
  },
  "tv.g1.tuloai.q003": {
    "type": "mcq",
    "correct": "bông hoa"
  },
  "tv.g1.tuloai.q004": {
    "type": "mcq",
    "correct": "bơi"
  },
  "tv.g1.tuloai.q005": {
    "type": "true-false",
    "correct": "true"
  },
  "tv.g1.tuloai.q006": {
    "type": "true-false",
    "correct": "false"
  },
  "tv.g1.tuloai.q007": {
    "type": "true-false",
    "correct": "true"
  },
  "tv.g1.tuloai.q008": {
    "type": "fill-blank",
    "correct": [
      "đọc"
    ]
  },
  "tv.g2.cauaithenao.q001": {
    "type": "mcq",
    "correct": "Bạn Lan rất chăm chỉ."
  },
  "tv.g2.cauaithenao.q002": {
    "type": "mcq",
    "correct": "rất trong xanh"
  },
  "tv.g2.cauaithenao.q003": {
    "type": "mcq",
    "correct": "Mèo con bắt chuột."
  },
  "tv.g2.cauaithenao.q004": {
    "type": "true-false",
    "correct": "true"
  },
  "tv.g2.cauaithenao.q005": {
    "type": "mcq",
    "correct": "Em bé"
  },
  "tv.g2.cauaithenao.q006": {
    "type": "fill-blank",
    "correct": [
      "mênh mông"
    ]
  },
  "tv.g2.cauaithenao.q007": {
    "type": "true-false",
    "correct": "false"
  },
  "tv.g2.tudacdiem.q001": {
    "type": "mcq",
    "correct": "xanh"
  },
  "tv.g2.tudacdiem.q002": {
    "type": "mcq",
    "correct": "cao"
  },
  "tv.g2.tudacdiem.q003": {
    "type": "mcq",
    "correct": "nhảy"
  },
  "tv.g2.tudacdiem.q004": {
    "type": "true-false",
    "correct": "true"
  },
  "tv.g2.tudacdiem.q005": {
    "type": "mcq",
    "correct": "cay"
  },
  "tv.g2.tudacdiem.q006": {
    "type": "mcq",
    "correct": "nhanh"
  },
  "tv.g2.tudacdiem.q007": {
    "type": "fill-blank",
    "correct": [
      "cao"
    ]
  },
  "tv.g2.tudacdiem.q008": {
    "type": "true-false",
    "correct": "false"
  },
  "tv.g3.dongtrainghia.q001": {
    "type": "mcq",
    "correct": "siêng năng"
  },
  "tv.g3.dongtrainghia.q002": {
    "type": "mcq",
    "correct": "thấp"
  },
  "tv.g3.dongtrainghia.q003": {
    "type": "mcq",
    "correct": "buồn"
  },
  "tv.g3.dongtrainghia.q004": {
    "type": "mcq",
    "correct": "lớn"
  },
  "tv.g3.dongtrainghia.q005": {
    "type": "true-false",
    "correct": "true"
  },
  "tv.g3.dongtrainghia.q006": {
    "type": "true-false",
    "correct": "false"
  },
  "tv.g3.dongtrainghia.q007": {
    "type": "fill-blank",
    "correct": [
      "tối"
    ]
  },
  "tv.g3.dongtrainghia.q008": {
    "type": "mcq",
    "correct": "xinh"
  }
};
