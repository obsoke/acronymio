import { generateAcronym } from './acronym.ts';
import { assertEquals } from 'std/assert/mod.ts';
import { distinct } from 'std/collections/mod.ts';

Deno.test(function testLength() {
  const acronym = generateAcronym(3);

  assertEquals(acronym.length, 3);
});

Deno.test(function testNoDuplicates() {
  const acronym = generateAcronym(3);

  const distinctAcronym = distinct(acronym);

  assertEquals(distinctAcronym.length, 3);
});

Deno.test(function testLargeAcronym() {
  const acronym = generateAcronym(10);

  const distinctAcronym = distinct(acronym);

  assertEquals(distinctAcronym.length, 10);
});
