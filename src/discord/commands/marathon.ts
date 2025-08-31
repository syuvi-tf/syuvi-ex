import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

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
