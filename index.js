const { Client, MessageEmbed } = require('discord.js');
const { config } = require('dotenv');
const client = new Client({
    disableMentions: 'everyone'
});
const guildInvites = new Map();
const ms = require('ms');

config({
    path: __dirname + "/.env"
})

client.login(process.env.TOKEN);

client.on('inviteCreate', async inivte => {
    const channel = inivte.guild.channels.cache.get('737093918776360960');
    if (channel) {
        const embed = new MessageEmbed()
            .setTitle(`Có link invite mới được tạo!`)
            .addField('Người tạo', inivte.inviter.tag)
            .setFooter(`ID: ${inivte.inviter.id}`)
            .addField('Số lượng: ', inivte.maxUses == 0 ? "Không giới hạn" : inivte.maxUses)
            .addField('Thời hạn của link: ', inivte.maxAge == 0 ? "Không giới hạn" : ms(inivte.maxAge, { long: true }))
            .setTimestamp()
        channel.send(embed)
    }
    guildInvites.set(inivte.guild.id, await inivte.guild.fetchInvites())
});

client.on('ready', () => {
    console.log(`${client.user.tag} đã đăng nhập!`);
    client.guilds.cache.forEach(guild => {
        guild.fetchInvites()
            .then(invites => guildInvites.set(guild.id, invites))
            .catch(err => console.log(err));
    })
    client.user.setPresence({
        activity: {
            name: '&invite',
            type: 'PLAYING'
        },
        status: 'online'
    })
})

client.on('guildMemberAdd', async member => {
    const cachedInvites = guildInvites.get(member.guild.id);
    const newInvites = await member.guild.fetchInvites();
    guildInvites.set(member.guild.id, newInvites);
    try {
        const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses);
        const channel = member.guild.channels.cache.get('737093918776360960');
        if (channel) {
            const embed = new MessageEmbed()
                .setDescription(`${member} (${member.user.tag}) đã vào server!\nMời bởi \`${usedInvite.inviter || !usedInvite ? "Không xác định được" : usedInvite.inviter.tag}\``)
                .setFooter(`ID người vào: ${member.id}`)
                .setTimestamp()
            channel.send(embed)
        }
    }
    catch(err) {
        console.log(err);
    }
})

client.on('message', async message => {
    const prefix = '&';
    if (message.author.bot) return;
    let choosePrefix = null;
    const prefixList = [`<@${client.user.id}>`, `<@!${client.user.id}>`, prefix];
    for (const thisprefix of prefixList) {
        if (message.content.toLowerCase().startsWith(thisprefix)) choosePrefix = thisprefix
    }
    if (prefix === null) return;
    if (!message.content.startsWith(choosePrefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    switch(cmd) {
        case 'invite': {
            if (!args[0]) return message.channel.send('VD: `&invite 3n 5m`\n3n = 3 người, 5m = 5 phút');
            let songuoi = args[0];
            if (!songuoi.endsWith('n')) return message.channel.send('Nhập số người invite (0n để không giới hạn)');
            songuoi = parseInt(args[0].replace('n', ''));
            let thoigian = args[1];
            if (thoigian !== 0) thoigian = ms(thoigian);
            if (!thoigian) return message.channel.send('Thời gian không hợp lệ!');
            let sanhchung = message.guild.channels.cache.get('702983688811708416');
            if (!sanhchung) return message.channel.send('Không tìm thấy channel sảnh chung!');
            let inv = await sanhchung.createInvite({ maxAge: thoigian, maxUses: songuoi });
            message.author.send(`Link invite của bạn: ${inv.url}`);
        }
    }
})

client.on('messageDelete', (message) => {
    if (message.author.bot) return;
    if (message.mentions.members) {
        const embed = new MessageEmbed()
            .setAuthor('Phát hiện Ghost Ping')
            .addField('Người gởi: ', message.author.tag)
            .addField('Nội dung: ', message.content)
            .setThumbnail('https://i.imgur.com/t1v2TFK.png');
        message.channel.send(embed);
    }
});