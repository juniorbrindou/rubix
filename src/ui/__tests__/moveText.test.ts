import { describeMove } from '../moveText';

test('consignes des mouvements', () => {
  expect(describeMove('R')).toBe('Tournez la face droite d’un quart de tour, dans le sens des aiguilles d’une montre, en la regardant de face.');
  expect(describeMove("U'")).toBe(
    'Tournez la face du haut d’un quart de tour, dans le sens inverse des aiguilles d’une montre, en la regardant de face.',
  );
  expect(describeMove('B2')).toBe('Tournez la face arrière d’un demi-tour.');
});
