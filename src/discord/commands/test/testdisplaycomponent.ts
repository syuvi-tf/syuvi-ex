import {
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from 'discord.js';

const embedColor = new Map<string, number>([
  ['marathon', 0xcba6f7],
  ['minithon', 0xf5c2e7],
  ['bounty', 0xfab387],
  ['motw', 0x89dceb],
  ['success', 0xa6e3a1],
  ['fail', 0xf38ba8],
]);

export default {
  data: new SlashCommandBuilder()
    .setName('testdisplaycomponent')
    .setDescription('test display components'),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const textDisplay = new TextDisplayBuilder().setContent('### editable marathons');

    const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

    const marathonDisplay = new TextDisplayBuilder()
      .setContent(`\`   phase   |  id  |  class  |        starts at        \`
\` upcoming  | 1    | soldier |\`<t:1756526940:f>
\` upcoming  | 2    | soldier |\`<t:1756526940:f>
\` upcoming  | 3    | soldier |\`<t:1756526940:f>
\` upcoming  | 4    | soldier |\`<t:1756526940:f>
\` upcoming  | 5    | soldier |\`<t:1756526940:f>
\` ready     | 6    | soldier |\`<t:1756526940:f>
\` ready     | 7    | soldier |\`<t:1756526940:f>
\` ready     | 8    | soldier |\`<t:1756526940:f>
\` ready     | 9    | soldier |\`<t:1756526940:f>
\` ready     | 10   | soldier |\`<t:1756526940:f>`);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('competition id')
      .setPlaceholder('id');

    for (let i = 1; i <= 10; i++) {
      selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`${i}`).setValue(`${i}`));
    }

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('❌')
      .setStyle(ButtonStyle.Secondary);

    const container = new ContainerBuilder()
      .setAccentColor(embedColor.get('marathon'))
      .addSectionComponents((section) =>
        section.addTextDisplayComponents(textDisplay).setButtonAccessory(cancelButton)
      )
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(marathonDisplay)
      .addSeparatorComponents(separator)
      .addActionRowComponents((ar) => ar.setComponents(selectMenu));

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
