// prettier-ignore
const NOTES = [
  {name: 'C', index: 0, octave: 4, accidental: false},
  {name: 'C#', index: 1, octave: 4, accidental: true},
  {name: 'D', index: 2, octave: 4, accidental: false},
  {name: 'Eb', index: 3, octave: 4, accidental: true},
  {name: 'E', index: 4, octave: 4, accidental: false},
  {name: 'F', index: 5, octave: 4, accidental: false},
  {name: 'F#', index: 6, octave: 4, accidental: true},
  {name: 'G', index: 7, octave: 4, accidental: false},
  {name: 'G#', index: 8, octave: 4, accidental: true},
  {name: 'A', index: 9, octave: 4, accidental: false},
  {name: 'Bb', index: 10, octave: 4, accidental: true},
  {name: 'B', index: 11, octave: 4, accidental: false},
]

const N = NOTES

// prettier-ignore
const CHORDS = {
  'Ionian'            : {name: 'Ionian', letter: 'A', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B']},
  'Dorian'            : {name: 'Dorian', letter: 'B', notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']},
  'Phrygian'          : {name: 'Phrygian', letter: 'C', notes: ['C', 'Eb', 'F', 'G', 'G#', 'Bb']},
  'Lydian'            : {name: 'Lydian', letter: 'D', notes: ['C', 'D', 'E', 'F#', 'G', 'A', 'B']},
  'Mixolydian'        : {name: 'Mixolydian', letter: 'E', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb']},
  'Aeolian'           : {name: 'Aeolian', letter: 'F', notes: ['C', 'D', 'Eb', 'F', 'G', 'G#', 'Bb']},
  'Locrian'           : {name: 'Locrian', letter: 'G', notes: ['C', 'C#', 'Eb', 'F', 'F#', 'G#', 'Bb']},
  'Mixolydian Altered': {name: 'Mixolydian Altered', letter: 'H', notes: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb']},
  'Altered Dominant'  : {name: 'Altered Dominant', letter: 'I', notes: ['C', 'C#', 'Eb', 'E', 'F#', 'G#', 'Bb']},
  'Major Altered'     : {name: 'Major Altered', letter: 'J', notes: ['C', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'B']},
  'Minor Altered'     : {name: 'Minor Altered', letter: 'K', notes: ['C', 'D', 'Eb', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']},
  'No third'          : {name: 'No third', letter: 'L', notes: ['C', 'C#', 'D', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']}
}
