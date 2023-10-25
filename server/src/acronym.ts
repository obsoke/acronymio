export function generateAcronym(length: number): string[] {
  const acronym: string[] = [];

  for (let i = 0; i < length; i++) {
    const num = Math.floor(Math.random() * 26 + 65);
    const char = String.fromCharCode(num);

    // no duplicates
    if (acronym.includes(char)) {
      i--;
      continue;
    }

    acronym.push(char);
  }

  return acronym;
}
