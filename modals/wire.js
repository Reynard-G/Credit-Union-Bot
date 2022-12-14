const { EmbedBuilder } = require('discord.js');

module.exports = {
    id: 'wire_modal',
    permissions: [],
    run: async (client, interaction) => {
        let { id, balance } = require('../events/interactionModal');
        let { receiverID, amount } = require('../slashCommands/bank/wire');
        let conn = await client.pool.getConnection();
        const receiverExists = (await conn.query(`SELECT EXISTS(SELECT * FROM eco WHERE id='${receiverID}');`));
        conn.release();

        if (receiverExists[0][`EXISTS(SELECT * FROM eco WHERE id='${receiverID}')`] == 0) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Invalid User')
                        .setDescription(`The user you entered has not registered or cannot be found.`)
                        .setColor('Red')
                        .setTimestamp()
                        .setFooter({ text: `INVALID USER`, iconURL: interaction.guild.iconURL() })
                ]
            });
        }

        if (amount > balance) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Insufficient Funds')
                        .setDescription(`You do not have enough funds to wire **$${amount}**.`)
                        .setColor('Red')
                        .setTimestamp()
                        .setFooter({ text: `${id}`, iconURL: interaction.guild.iconURL() })
                ]
            });
        }

        conn = await client.pool.getConnection();
        const receiverBalance = (await conn.query(`SELECT balance FROM eco WHERE id='${receiverID}';`))[0].balance;
        await conn.query(`UPDATE eco SET balance=${receiverBalance + amount} WHERE id='${receiverID}';`);
        await conn.query(`UPDATE eco SET balance=${balance - amount} WHERE id='${id}';`);
        conn.release();
        
        return await interaction.reply({
            ephemeral: true,
            embeds: [
                new EmbedBuilder()
                    .setTitle('Wire Transfer')
                    .setDescription(`You have successfully wired **$${amount}** to \`${receiverID}\`!`)
                    .setColor('Green')
                    .setTimestamp()
                    .setFooter({ text: `${id} `, iconURL: interaction.guild.iconURL() })
            ]
        });
    }
};