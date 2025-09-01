import {
  blockQuote,
  ChatInputCommandInteraction,
  inlineCode,
  MessageFlags,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  time,
} from 'discord.js';
import { competitionCreateContainer, dateModal } from '../../lib/discord/displaycomponents.js';

const commandData = new SlashCommandBuilder()
  .setName('marathon')
  .setDescription('create, edit, open, or cancel a marathon')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) =>
    option
      .setName('action')
      .setDescription('the action to take')
      .setRequired(true)
      .addChoices(
        { name: 'create', value: 'create' },
        { name: 'edit', value: 'edit' },
        { name: 'open', value: 'open' },
        { name: 'cancel', value: 'cancel' }
      )
  );

export default {
  data: commandData,
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const action: string = interaction.options.getString('action', true);
    switch (action) {
      case 'create': {
        const messageResponse = await interaction.editReply({
          components: [competitionCreateContainer('marathon')],
          flags: MessageFlags.IsComponentsV2,
        });

        const componentCollector = messageResponse.createMessageComponentCollector({
          time: 300_000,
          filter: (i) => i.user.id === interaction.user.id,
        });

        componentCollector.on('collect', async (collected) => {
          if (collected.customId === 'dateButton') {
            await collected.showModal(dateModal('marathon'));

            // error handle
            const modalSubmit: ModalSubmitInteraction = await collected.awaitModalSubmit({
              time: 180_000,
            });
            await modalSubmit.deferReply({ flags: MessageFlags.Ephemeral });

            const month = modalSubmit.fields.getTextInputValue('month').padStart(2, '0');
            const day = modalSubmit.fields.getTextInputValue('day').padStart(2, '0');
            const offset = modalSubmit.fields.getTextInputValue('offset').padStart(2, '0');

            const now = new Date();
            const date = new Date(`${now.getUTCFullYear()}-${month}-${day}T${offset}:00Z`);

            if (now > date) {
              date.setUTCFullYear(date.getUTCFullYear() + 1);
            }

            // check for invalid date
            if (isNaN(date.getTime())) {
              await modalSubmit.editReply({
                content: `marathon start date not set
${blockQuote(`${inlineCode(`${month}/${day} at ${offset}:00 UTC`)} is an invalid date`)}`,
              });
            } else {
              await modalSubmit.editReply({ content: `marathon start date set for ${time(date)}` });
            }
          }
        });
        // creation options
        // display component for..
        // month, day, hours offset
        // select divisions
        // select placements
        //
        // then modal for maps

        // confirm button when finished
        break;
      }
      case 'edit': {
        // show marathons that are 'ready' | 'upcoming', prompt to select one to edit
        // then, edit options (starts_at, class, divisions, maps, placements)
        // buttons for each of them

        // const marathons = await MarathonTable.getAllByPhases('ready', 'upcoming');
        // await interaction.editReply({ embeds: [embed.competitionList('marathon', marathons)] });
        break;
      }
      //
      case 'open': {
        // show marathons that are 'ready', prompt to select one to open
        // then, open signups for it (#signup message)
        break;
      }
      case 'cancel': {
        // show marathons that are 'ready' | 'upcoming', prompt for one to cancel
        // if there is a signup message, delete it
        break;
      }
    }

    // create
    // marathon creation options and confirmation, creates it in 'ready' state

    // edit
    // marathon options and confirmation, available when 'ready' and 'upcoming'

    // open
    // open a marathon and confirm, for 'ready' marathons

    // cancel
    // cancel a marathon, available when 'ready' and 'upcoming'
  },
};
