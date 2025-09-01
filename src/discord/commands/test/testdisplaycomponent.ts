import {
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from 'discord.js';

const accentColor = new Map<string, number>([
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
    await interaction.deferReply({ withResponse: true });

    const textDisplay = new TextDisplayBuilder().setContent('### editable marathons');

    const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

    const marathonDisplay = new TextDisplayBuilder()
      .setContent(`\`   phase   |  id  |  class  | starts at \`
\` upcoming  | 1    | soldier |\`<t:1756526940:d>
\` upcoming  | 2    | soldier |\`<t:1756526940:d>
\` upcoming  | 3    | soldier |\`<t:1756526940:d>
\` upcoming  | 4    | soldier |\`<t:1756526940:d>
\` upcoming  | 5    | soldier |\`<t:1756526940:d>
\` ready     | 6    | soldier |\`<t:1756526940:d>
\` ready     | 7    | soldier |\`<t:1756526940:d>
\` ready     | 8    | soldier |\`<t:1756526940:d>
\` ready     | 9    | soldier |\`<t:1756526940:d>
\` ready     | 10   | soldier |\`<t:1756526940:d>`);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('competition_id')
      .setPlaceholder('id');

    for (let i = 1; i <= 10; i++) {
      selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`${i}`).setValue(`${i}`));
    }

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('❌')
      .setStyle(ButtonStyle.Secondary);

    const container = new ContainerBuilder()
      .setAccentColor(accentColor.get('marathon'))
      .addSectionComponents((section) =>
        section.addTextDisplayComponents(textDisplay).setButtonAccessory(cancelButton)
      )
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(marathonDisplay)
      .addSeparatorComponents(separator)
      .addActionRowComponents((ar) => ar.setComponents(selectMenu));

    const responseMessage = await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    // 5 minute collector
    const buttonCollector = responseMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 3_000_000,
    });

    // 5 minute collector
    const selectCollector = responseMessage.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 3_000_000,
    });

    buttonCollector.on('collect', async (collected) => {
      if (collected.customId === 'cancel') {
        await interaction.deleteReply();
        await interaction.followUp({
          content: 'canceled test',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    });

    selectCollector.on('collect', async (collected) => {
      const id = collected.values[0];
      console.log(`collector [${collected.customId}] collected id [${id}]`);
      return;
    });
  },
};
