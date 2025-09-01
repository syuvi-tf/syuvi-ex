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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

const accentColor = new Map<string, number>([
  ['marathon', 0xcba6f7],
  ['minithon', 0xf5c2e7],
  ['bounty', 0xfab387],
  ['motw', 0x89dceb],
  ['success', 0xa6e3a1],
  ['fail', 0xf38ba8],
]);

function numberedOptions(min: number, max: number): StringSelectMenuOptionBuilder[] {
  const options: StringSelectMenuOptionBuilder[] = [];
  for (let i = min; i <= max; i++) {
    options.push(new StringSelectMenuOptionBuilder().setLabel(`${i}`).setValue(`${i}`));
  }
  return options;
}

function divisionOptions(competitionClass: string): StringSelectMenuOptionBuilder[] {
  const options: StringSelectMenuOptionBuilder[] = [];
  const divisions: readonly string[] =
    competitionClass === 'soldier' ? soldierDivisions : demoDivisions;

  for (const division of divisions) {
    options.push(new StringSelectMenuOptionBuilder().setLabel(division).setValue(division));
  }

  return options;
}

function placementSelects(
  divisions: SoldierDivision[] | DemoDivision[]
): ActionRowBuilder<StringSelectMenuBuilder>[] {
  const selects: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
  for (const division of divisions) {
    selects.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
        new StringSelectMenuBuilder()
          .setCustomId(division)
          .setPlaceholder(division)
          .setOptions(numberedOptions(1, 16))
      )
    );
  }

  return selects;
}

function mapInputs(
  divisions: SoldierDivision[] | DemoDivision[]
): ActionRowBuilder<TextInputBuilder>[] {
  const inputs: ActionRowBuilder<TextInputBuilder>[] = [];

  for (const division of divisions) {
    inputs.push(
      new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
          .setCustomId(`map${division}`)
          .setLabel(`${division} map`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
  }

  return inputs;
}

export function dateModal(type: CompetitionType): ModalBuilder {
  const dateModal = new ModalBuilder()
    .setCustomId('dateModal')
    .setTitle(`${type} start date (UTC)`)
    .setComponents(
      new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
          .setCustomId('month')
          .setLabel('month')
          .setPlaceholder('1-12')
          .setMinLength(1)
          .setMaxLength(2)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
          .setCustomId('day')
          .setLabel('day')
          .setPlaceholder('1-31')
          .setMinLength(1)
          .setMaxLength(2)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
          .setCustomId('offset')
          .setLabel('positive UTC offset, in hours')
          .setPlaceholder('0-12')
          .setMinLength(1)
          .setMaxLength(2)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

  return dateModal;
}

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

  const dateButton = new ButtonBuilder()
    .setCustomId('dateButton')
    .setLabel('set date')
    .setStyle(ButtonStyle.Primary);

  const mapsButton = new ButtonBuilder()
    .setCustomId('mapsButton')
    .setLabel('set maps')
    .setStyle(ButtonStyle.Primary);

  const classSelect = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
    new StringSelectMenuBuilder()
      .setCustomId('class')
      .setPlaceholder('class')
      .setOptions(
        new StringSelectMenuOptionBuilder().setLabel('Soldier').setValue('Soldier'),
        new StringSelectMenuOptionBuilder().setLabel('Demo').setValue('Demo')
      )
  );

  const divisionsSelect = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
    new StringSelectMenuBuilder()
      .setCustomId('divisions')
      .setPlaceholder('divisions')
      .setOptions(
        new StringSelectMenuOptionBuilder().setLabel('placeholder').setValue('placeholder')
      )
  );

  const container = new ContainerBuilder()
    .setAccentColor(accentColor.get(type))
    .addSectionComponents(header)
    .addSeparatorComponents(separator)
    .addActionRowComponents((ar) => ar.setComponents(dateButton, mapsButton))
    .addActionRowComponents(classSelect);
  return container;
}
