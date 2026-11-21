import { describeMove } from '../moveText';

test('consignes des mouvements', () => {
  expect(describeMove('R')).toBe('Tourne la face droite d’un quart de tour, dans le sens des aiguilles d’une montre, en la regardant de face.');
  expect(describeMove("U'")).toBe(
    'Tourne la face du haut d’un quart de tour, dans le sens inverse des aiguilles d’une montre, en la regardant de face.',
  );
  expect(describeMove('B2')).toBe('Tourne la face arrière d’un demi-tour.');
});
