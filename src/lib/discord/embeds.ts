import { EmbedBuilder, inlineCode, time, TimestampStyles, type ColorResolvable } from 'discord.js';

const embedColor = new Map<string, ColorResolvable>([
  ['marathon', '#CBA6F7'],
  ['minithon', '#F5C2E7'],
  ['bounty', '#FAB387'],
  ['motw', '#89DCEB'],
  ['success', '#A6E3A1'],
  ['fail', '#F38BA8'],
]);

function formatCompetitionList(competitions: Competition[]): string {
  let line = `${inlineCode(`   phase   |  id  |  class  |       starts at       `)}
`;
  for (const competition of competitions) {
    const phase = ` ${competition.phase.padEnd(10)}`;
    const id = ` ${competition.competition_id.toString().padEnd(5)}`;
    const competitionClass = ` ${competition.class.padEnd(8)}`;
    const starts_at = time(competition.starts_at, TimestampStyles.ShortDateTime);

    line += `${inlineCode(`${phase}|${id}|${competitionClass}|`)} ${starts_at}
`;
  }
  return line;
}

function competitionList(type: CompetitionType, competitions: Competition[]): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(embedColor.get(type) ?? null)
    .setAuthor({ name: type })
    .setDescription(formatCompetitionList(competitions));
}

export default { competitionList };
