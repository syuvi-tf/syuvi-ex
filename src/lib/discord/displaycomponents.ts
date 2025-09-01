import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from 'discord.js';
const accentColor = new Map<string, number>([
  ['marathon', 0xcba6f7],
  ['minithon', 0xf5c2e7],
  ['bounty', 0xfab387],
  ['motw', 0x89dceb],
  ['success', 0xa6e3a1],
  ['fail', 0xf38ba8],
]);

function competitionHeader(action: string, type: CompetitionType): SectionBuilder {
  const text = new TextDisplayBuilder().setContent(`### ${action} ${type}`);
  const cancel = new ButtonBuilder()
    .setCustomId('cancel')
    .setLabel('❌')
    .setStyle(ButtonStyle.Secondary);

  const header = new SectionBuilder().addTextDisplayComponents(text).setButtonAccessory(cancel);
  return header;
}

export function competitionCreateContainer(type: CompetitionType): ContainerBuilder {
  const header: SectionBuilder = competitionHeader('create', type);
  const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  const yearSelect = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
    new StringSelectMenuBuilder()
      .setCustomId('year')
      .setPlaceholder('year')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel(`${year}`).setValue(`${year}`),
        new StringSelectMenuOptionBuilder().setLabel(`${year + 1}`).setValue(`${year + 1}`)
      )
  );

  const monthSelect = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
    new StringSelectMenuBuilder()
      .setCustomId('month')
      .setPlaceholder('month')
      .addOptions(new StringSelectMenuOptionBuilder().setLabel(`${month}`).setValue(`${month}`))
      .setDisabled(true)
  );

  const daySelect = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
    new StringSelectMenuBuilder()
      .setCustomId('day')
      .setPlaceholder('day')
      .addOptions(new StringSelectMenuOptionBuilder().setLabel(`${day}`).setValue(`${day}`))
      .setDisabled(true)
  );

  const container = new ContainerBuilder()
    .setAccentColor(accentColor.get(type))
    .addSectionComponents(header)
    .addSeparatorComponents(separator)
    .addActionRowComponents(yearSelect)
    .addActionRowComponents(monthSelect)
    .addActionRowComponents(daySelect);

  return container;
}
