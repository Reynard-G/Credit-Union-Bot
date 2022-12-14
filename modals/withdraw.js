const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");

module.exports = {
    id: 'withdraw_modal',
    permissions: [],
    run: async (client, interaction) => {
        let { id, balance } = require('../events/interactionModal');
        let { amount } = require('../slashCommands/bank/withdraw');
        let ign = interaction.fields.getTextInputValue('ignInput');
        let db = new QuickDB({ filePath: `./data/withdrawRequests.sqlite` });

        if (await db.has(`${interaction.guild.id}.${id}.amount`)) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Withdrawal Request')
                        .setDescription(`You already have a withdrawal request pending! Do \`/cancel withdraw\` to cancel your request.`)
                        .setColor('Red')
                        .setTimestamp()
                        .setFooter({ text: `${id} `, iconURL: interaction.guild.iconURL() })
                ]
            });
        }

        if (balance < amount) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Insufficient Funds')
                        .setDescription(`You do not have enough funds to withdraw **$${amount}**.`)
                        .setColor('Red')
                        .setTimestamp()
                        .setFooter({ text: `Gamblers Anonymous`, iconURL: interaction.guild.iconURL() })
                ]
            });
        }

        const userID = interaction.user.id;
        db = new QuickDB({ filePath: `./data/withdrawInfo.sqlite` });
        const channelID = await db.get(`${interaction.guild.id}.channelID.withdrawChannelID`);
        const percentage = await db.get(`${interaction.guild.id}.rate.percentage`) ?? 0;
        const constant = await db.get(`${interaction.guild.id}.rate.constant`) ?? 0;
        const taxedAmount = +Number(Math.round(parseFloat(((amount * ((100 - percentage) / 100)) - constant) + "e2")) + "e-2");

        requestEmbed = new EmbedBuilder()
            .setTitle('Withdrawal Request')
            .setDescription(`
            Payment IGN: ${ign} \n Amount: **$${amount}** \n Taxed Amount (${percentage}% + $${constant}): **$${taxedAmount}** \n Current Balance: **$${balance}**
            `)
            .setColor('White')
            .setTimestamp()
            .setFooter({ text: `Gamblers Anonymous`, iconURL: interaction.guild.iconURL() });

        buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Approve')
                    .setStyle('Success')
                    .setEmoji('<:approved:815575466231463956>')
                    .setCustomId('withdraw_approve_button'),
                new ButtonBuilder()
                    .setLabel('Deny')
                    .setStyle('Danger')
                    .setEmoji('<:denied:815575438750777344>')
                    .setCustomId('withdraw_deny_button')
            );

        const channel = await client.channels.cache.get(channelID) ?? interaction.channel;
        const requestMsg = await channel.send({ embeds: [requestEmbed], components: [buttons] }); // Send withdrawal request in set channel

        await interaction.reply({
            ephemeral: true,
            embeds: [
                new EmbedBuilder()
                    .setTitle('Withdrawal Request Sent')
                    .setDescription(`
                    Amount: **$${amount}** \n Taxed Amount (${percentage}% + $${constant}): **$${taxedAmount}** \n Current Balance: **$${balance}**
                    `)
                    .setColor('Green')
                    .setTimestamp()
                    .setFooter({ text: `Gamblers Anonymous`, iconURL: interaction.guild.iconURL() })
            ]
        });

        db = new QuickDB({ filePath: `./data/withdrawRequests.sqlite` });
        await db.set(`${interaction.guild.id}.${id}.amount`, amount);
        await db.set(`${interaction.guild.id}.${id}.requestMsgID`, requestMsg.id);
        await db.set(`${interaction.guild.id}.${id}.channelID`, channelID);

        return module.exports = { requestEmbed, buttons, percentage, constant, taxedAmount, amount, balance, userID, id, ign };
    }
};