const fs = require('fs');
const path = './.lock';

if (fs.existsSync(path)) {
  console.error('❌ البوت شغال بالفعل!');
  process.exit(1);
}
fs.writeFileSync(path, 'running');
require('dotenv').config();

let cachedOwner = null;
const greetedUsers = new Set();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');

const { log } = require('./logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const NEW_ROLE_NAME = '🔰 New Members';
const OWNER_ID = '1236181129556525117';

const roleKeywords = {
  '🛠️ Developers': [
    'برمج', 'برمجة', 'مطور', 'كود', 'كودينج', 'سكربت', 'backend', 'frontend', 'fullstack',
    'ويب', 'web', 'موقع', 'مواقع', 'game dev', 'game developer', 'developer', 'unity', 'unreal', 'godot',
    'html', 'css', 'js', 'javascript', 'typescript', 'ts', 'react', 'angular', 'vue', 'svelte',
    'php', 'laravel', 'node', 'express', 'django', 'python', 'java', 'c#', 'c++', 'sql', 'nosql',
    'firebase', 'mongodb', 'api', 'oop', 'algorithms', 'structure', 'logic'
  ],
  '🎨 2D Artists': [
    '2d', 'pixel', 'بيكسل', 'aseprite', 'krita', 'رسام', 'ارسم', 'رسم', 'sprites',
    'فنان 2d', 'شخصيات 2d', 'واجهة', 'concept', 'illustration', 'drawing', 'لوحة', 'لوحات'
  ],
  '🌀 3D Artists': [
    '3d', 'blender', 'maya', 'substance', 'zbrush', 'مجسمات', 'نحت', 'فنان 3d',
    'شخصيات 3d', 'نموذج', 'موديل', 'uv', 'ريج', 'modeling', 'sculpt', 'texturing'
  ],
  '📽️ Animators': [
    'تحريك', 'أنيميشن', 'animation', 'frame by frame', 'bones', 'skeletal',
    'dragonbones', 'حركة', 'animate', 'متحرك', 'character animation', 'توقيت', 'تايمينج'
  ],
  '🧠 Designers': [
    'مصمم', 'تصميم', 'فكرة', 'افكار', 'مراحل', 'level design', 'game design', 'game designer',
    'ميكانيك', 'mechanics', 'ux', 'ui', 'ux/ui', 'واجهة', 'واجهات', 'menus', 'flow', 'narrative',
    'story', 'player experience', 'balance', 'difficulty', 'tutorial', 'tutorial design', 'figma',
    'wireframe', 'mockup', 'gameplay', 'usability'
  ],
  '🧠 AI Team': [
    'machine learning', 'ml', 'deep learning', 'تدريب نماذج',
    'vision', 'nlp', 'chatbot', 'model', 'dataset', 'خوارزميات',
    'reinforcement learning', 'tensorflow', 'pytorch', 'ذكاء حقيقي',
    'ai team', 'neural network', 'ذكاء صناعي', 'ذكاء اصطناعي'
  ]
};

const questions = [
  "🔹 اسمك؟",
  "🔹 منين؟",
  "🔹 دورك في الفريق؟ (مصمم / مبرمج / فنان...؟)",
  "🔹 مهاراتك؟",
  "🔹 متاح كم ساعة بالأسبوع؟",
  "🔹 أي حاجة حابب تقولها؟"
];

client.once('ready', async () => {
  await log(`✅ البوت شغال: ${client.user.tag}`, client);
  try {
    cachedOwner = await client.users.fetch(OWNER_ID);
    await log(`✅ تم تخزين صاحب السيرفر: ${cachedOwner.tag}`, client);
  } catch (err) {
    await log("❌ فشل في تحميل بيانات الأونر: " + err.message, client);
  }
});

client.on('guildMemberAdd', async member => { 
 if (greetedUsers.has(member.id)) return;
  greetedUsers.add(member.id);

  try {
    await log(`🆕 انضم عضو جديد: ${member.user.tag}`, client);
    const role = member.guild.roles.cache.find(r => r.name === NEW_ROLE_NAME);
    if (role) await member.roles.add(role);

    const dm = await member.send(`أهلاً بيك <@${member.id}> 👋!\nجاوب على الأسئلة دي (كل إجابة في رسالة منفصلة):\n\n${questions.join("\n")}`);
    const filter = m => m.author.id === member.id;
    const collector = dm.channel.createMessageCollector({ filter, max: questions.length, time: 600000 });

    const answers = [];
    collector.on('collect', msg => answers.push(msg.content));

    collector.on('end', async () => {
      if (answers.length === 0) return;

      const introChannel = member.guild.channels.cache.get(process.env.INTRO_CHANNEL_ID);
      if (!introChannel) return;

      const embed = new EmbedBuilder()
        .setTitle(`👤 عضو جديد: ${member.user.tag}`)
        .addFields(
          { name: '🔹 الاسم', value: answers[0] || '---' },
          { name: '🔹 منين؟', value: answers[1] || '---' },
          { name: '🔹 الدور', value: answers[2] || '---' },
          { name: '🔹 المهارات', value: answers[3] || '---' },
          { name: '🔹 التوفر الأسبوعي', value: answers[4] || '---' },
          { name: '🔹 إضافات؟', value: answers[5] || '---' }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await introChannel.send({ embeds: [embed] });
      await log(`📩 تم إرسال معلومات العضو ${member.user.tag} إلى قناة التعريف`, client);

      let searchText = (answers[2] || '').toLowerCase();
      const hasMatchInRole = Object.values(roleKeywords).some(keywords => keywords.some(k => searchText.includes(k)));
      if (!hasMatchInRole) {
        searchText = answers.join(' ').toLowerCase();
      }

      const matchedRoles = Object.entries(roleKeywords).filter(([_, keywords]) =>
        keywords.some(k => searchText.includes(k))
      ).map(([role]) => role);

      if (matchedRoles.length === 0) {
        await member.send("❌ ماقدرناش نحدد دور واضح، هنراجع بياناتك يدويًا 🔍");
        await log(`❌ معرفناش نحدد دور لـ ${member.user.tag}`, client);
        return;
      }

      const selected = [];
      const buttons = matchedRoles.map(role =>
        new ButtonBuilder()
          .setCustomId(`select_${role}`)
          .setLabel(role)
          .setStyle(ButtonStyle.Primary)
      );

      const actionRow = new ActionRowBuilder().addComponents(buttons.slice(0, 5));
      await member.send({ content: "🎯 اختر الرولات اللي شايفها مناسبة ليك (ممكن أكتر من واحدة):", components: [actionRow] });

      const dmButtonCollector = dm.channel.createMessageComponentCollector({ time: 300000 });

      dmButtonCollector.on('collect', async interaction => {
        if (interaction.user.id !== member.id) return;
        const roleName = interaction.customId.replace("select_", "");
        if (!selected.includes(roleName)) selected.push(roleName);
        await interaction.reply({ content: `✅ تم اختيار: ${roleName}`, ephemeral: true });
      });

      let sentApproval = false;

const sendApproval = async () => {
  if (sentApproval || selected.length === 0) return;

  sentApproval = true;

  const owner = cachedOwner;
  if (!owner) return console.error("❌ الأونر مش محفوظ.");

  const approvalEmbed = new EmbedBuilder()
    .setTitle("📥 طلب انضمام جديد")
    .setDescription(`**${member.user.tag}** اختار الرولات:\n${selected.map(r => `• ${r}`).join('\n')}`)
    .setColor(0x3498db)
    .setTimestamp();

  const approveRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_${member.id}`).setLabel("✅ موافقة").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_${member.id}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await owner.send({ embeds: [approvalEmbed], components: [approveRow] });
};

dmButtonCollector.on('collect', async interaction => {
  if (interaction.user.id !== member.id) return;

  const roleName = interaction.customId.replace("select_", "");
  if (!selected.includes(roleName)) selected.push(roleName);

  await interaction.reply({ content: `✅ تم اختيار: ${roleName}`, ephemeral: true });

  // 🧠 أول ما يختار أول واحدة، ابعت فورًا
  await sendApproval();
});

dmButtonCollector.on('end', async () => {
  if (selected.length === 0) {
    await member.send("⚠️ من فضلك اختار على الأقل رول واحد علشان نقدر نساعدك.");
    return;
  }

  // 👇 احتياطي لو مقدرش يبعت وقت الاختيار
  await sendApproval();
});

        await log(`📨 بعتنا الطلب للأونر علشان يوافق على ${member.user.tag}`, client);
      });
    });

  } catch (err) {
    await log("❌ حصلت مشكلة: " + err.message, client);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  const [action, targetId] = interaction.customId.split('_');
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const member = await guild.members.fetch(targetId).catch(() => null);
  if (!member) return;

  if (action === 'approve') {
    const guildMember = await guild.members.fetch(member.id);
    const roleNames = interaction.message.embeds[0].description.split('\n').map(line => line.replace('• ', '').trim());
    for (const roleName of roleNames) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) await guildMember.roles.add(role);
    }

    const newMemberRole = guild.roles.cache.find(r => r.name === NEW_ROLE_NAME);
    if (newMemberRole && guildMember.roles.cache.has(newMemberRole.id)) {
      await guildMember.roles.remove(newMemberRole);
    }

    await interaction.reply({ content: `✅ تم تعيين الرولات لـ ${member.user.tag}`, ephemeral: true });
    await member.send("🎉 تم إعتمادك و تعيين الرولات المطلوبة. مرحب بيك!");
    await log(`✅ وافقنا على ${member.user.tag} وأضفنا الرولات: ${roleNames.join(', ')}`, client);
  } else if (action === 'reject') {
    await interaction.reply({ content: "❌ تم رفض الطلب.", ephemeral: true });
    await member.send("❌ تم رفض طلب الرولات. ممكن يتراجع لاحقًا حسب رأي الإدارة.");
    await log(`❌ رفضنا ${member.user.tag}`, client);
  }
});

client.login(process.env.TOKEN);
