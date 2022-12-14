const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");

module.exports = {
	id: 'deposit_approve_button',
	permissions: [],
	run: async (client, interaction) => {
		let { requestEmbed, buttons, attachment, percentage, constant, taxedAmount, amount, balance, userID, id } = require("../modals/deposit");

		const conn = await client.pool.getConnection();
		balance = (await conn.query(`SELECT balance FROM eco WHERE id = '${id}';`))[0].balance; // Get balance again to update it
		const currBalance = +Number(Math.round(parseFloat((balance + taxedAmount) + "e2")) + "e-2");
		await conn.query(`UPDATE eco SET balance=${currBalance} WHERE id='${id}';`);
		conn.release();

		buttons.components[0].setDisabled(true);
		buttons.components[1].setDisabled(true);

		requestEmbed = new EmbedBuilder()
			.setTitle('Deposit Request')
			.setDescription(`
			Amount: **$${amount}** \n Taxed Amount (${percentage}% + $${constant}): **$${taxedAmount}** \n Status: **APPROVED** \n Old Balance: **$${balance}** \n New Balance: **$${currBalance}**
			`)
			.setImage(attachment.proxyURL)
			.setColor('Green')
			.setTimestamp()
			.setFooter({ text: `Gamblers Anonymous`, iconURL: interaction.guild.iconURL() });

		await interaction.update({
			embeds: [requestEmbed],
			components: [buttons]
		});

		const approveEmbed = new EmbedBuilder()
			.setTitle('Deposit Approved')
			.setDescription(`
			Amount: **$${amount}** \n Taxed Amount (${percentage}% + $${constant}): **$${taxedAmount}** \n Status: **APPROVED** \n Old Balance: **$${balance}** \n New Balance: **$${currBalance}**
			`)
			.setColor('Green')
			.setTimestamp()
			.setFooter({ text: `Gamblers Anonymous`, iconURL: interaction.guild.iconURL() });

		await client.users.cache.get(userID).send({
			embeds: [approveEmbed]
		});

		const db = new QuickDB({ filePath: `./data/depositRequests.sqlite` });
		return await db.delete(`${interaction.guild.id}.${id}.amount`);
	}
};
