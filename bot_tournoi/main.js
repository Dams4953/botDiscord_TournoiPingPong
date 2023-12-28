const fs = require('fs');
const { Client, IntentsBitField } = require('discord.js');
const bot = new Client({ intents: [IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.Guilds] });

const token = 'MTE4ODE4MzkyMTAzNzQyMjY2Mw.GEIKCr.CaIE2GIuAHcU7Cu-RZ8AMN0htpNuLsDCPtOCBE';
let scores = {};
let matchsPrevus = [];



// Function: ajouterJoueur
// Description: fonction de la commande !ajouterjoueur.
function ajouterJoueur(message, args) {
    if (args.length < 2) {
        message.reply("Usage : !ajouterjoueur [nomJoueur] [categorie]");
        return;
    }

    const [nomJoueur, categorie] = args;
    if (scores[nomJoueur]) {
        message.reply("Ce joueur est déjà enregistré.");
        return;
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(categorie)) {
        message.reply("Catégorie invalide. Les catégories valides sont A, B, C, D, E.");
        return;
    }

    scores[nomJoueur] = { points: 0, categorie: categorie, matchs: [] };
    message.reply(`**Joueur Ajouté :** ${nomJoueur} dans la catégorie ${categorie}.`);
    sauvegarderDonnees();
}



// Function: ajouterScore
// Description: fonction de la commande !ajouterscore.
function ajouterScore(message, args) {
    if (args.length !== 4) {
        message.reply(`**Score Enregistré :** ${joueur1} (${score1}) vs ${joueur2} (${score2})`);
        return;
    }

    const [joueur1, joueur2, score1, score2] = args.map(arg => arg.trim());
    const scoreJoueur1 = parseInt(score1, 10);
    const scoreJoueur2 = parseInt(score2, 10);

    if (isNaN(scoreJoueur1) || isNaN(scoreJoueur2)) {
        message.reply("Les scores doivent être des nombres valides.");
        return;
    }

    if (!scores[joueur1] || !scores[joueur2]) {
        message.reply("Un ou plusieurs joueurs spécifiés n'existent pas.");
        return;
    }

    if (scoreJoueur1 > scoreJoueur2) {
        scores[joueur1].points += 3;
    } else if (scoreJoueur2 > scoreJoueur1) {
        scores[joueur2].points += 3;
    }

    scores[joueur1].matchs.push({ adversaire: joueur2, score: scoreJoueur1, scoreAdversaire: scoreJoueur2 });
    scores[joueur2].matchs.push({ adversaire: joueur1, score: scoreJoueur2, scoreAdversaire: scoreJoueur1 });

    message.reply(`Score enregistré : ${joueur1} (${score1}) vs ${joueur2} (${score2})`);
    sauvegarderDonnees();

    // Marquer le match comme joué
    const matchTrouve = matchsPrevus.find(m => 
        (m.joueur1 === joueur1 && m.joueur2 === joueur2) || 
        (m.joueur1 === joueur2 && m.joueur2 === joueur1)
    );
    if (matchTrouve) matchTrouve.joue = true;
}



// Function: afficherScores
// Description: fonction de la commande !score.
function afficherScores(message) {
    if (Object.keys(scores).length === 0) {
        message.reply("Aucun score n'a été enregistré jusqu'à présent.");
        return;
    }

    let reponse = "**Scores par Catégories :**\n";
    const categories = { A: [], B: [], C: [], D: [], E: [], Inconnue: [] };

    for (const joueur in scores) {
        const infoJoueur = scores[joueur];
        const categorie = infoJoueur.categorie in categories ? infoJoueur.categorie : "Inconnue";
        categories[categorie].push(`${joueur} : ${infoJoueur.points} points`);
    }

    for (const categorie in categories) {
        if (categories[categorie].length > 0) {
            reponse += `\n\t**__Catégorie ${categorie}__**:\n${categories[categorie].join('\n')}`;
        }
    }

    message.reply(reponse);
}



// Function: afficherJoueurs
// Description: fonction de la commande !joueurs.
function afficherJoueurs(message) {
    const listeJoueurs = Object.keys(scores);
    if (listeJoueurs.length === 0) {
        message.reply("Il n'y a pas encore de joueurs enregistrés.");
        return;
    }

    let reponse = "Liste des joueurs et leurs catégories:\n";
    listeJoueurs.forEach(joueur => {
        reponse += `- ${joueur} (Catégorie: ${scores[joueur].categorie})\n`;
    });

    message.reply(reponse);
}



// Function: afficherMatchsCategorie
// Description: fonction de la commande !categorie.
function afficherMatchsCategorie(message, args) {
    const categorie = args[0];
    if (!categorie) {
        message.reply("Vous devez spécifier une catégorie.");
        return;
    }

    let matchsCategorie = "";
    let matchsTraites = new Set();

    Object.entries(scores).forEach(([joueur, info]) => {
        if (info.categorie === categorie) {
            info.matchs.forEach(match => {
                const matchKey = [joueur, match.adversaire].sort().join('-');
                if (!matchsTraites.has(matchKey)) {
                    matchsCategorie += `${joueur} a joué contre ${match.adversaire} avec un score de ${match.score} - ${match.scoreAdversaire}\n`;
                    matchsTraites.add(matchKey);
                }
            });
        }
    });

    if (matchsCategorie === "") {
        message.reply(`Aucun match trouvé pour la catégorie ${categorie}.`);
    } else {
        message.reply(`Matchs de la catégorie ${categorie}:\n${matchsCategorie}`);
    }
}



// Function: ajouterMatchs
// Description: fonction de la commande !ajoutermatchs.
function ajouterMatchs(message, args) {
    let joueur1 = args[0];
    let joueur2 = args[1];

    // Vérifiez si les joueurs existent et récupérez leurs catégories
    if (scores[joueur1] && scores[joueur2]) {
        let categorieJoueur1 = scores[joueur1].categorie;
        let categorieJoueur2 = scores[joueur2].categorie;

        if (categorieJoueur1 === categorieJoueur2) {
            let nouveauMatch = { joueur1: joueur1, joueur2: joueur2, categorie: categorieJoueur1 };
            matchsPrevus.push(nouveauMatch);

            message.reply(`Match ajouté entre ${joueur1} et ${joueur2} dans la catégorie ${categorieJoueur1}.`);
        } else {
            message.reply("Les joueurs ne sont pas dans la même catégorie.");
        }
    } else {
        message.reply("Un ou plusieurs joueurs spécifiés n'existent pas.");
    }

    // Sauvegardez les données si nécessaire
    sauvegarderDonnees();
}





// Function: afficherMatchsRestants
// Description: fonction de la commande !matchs.
function afficherMatchsRestants(message) {
    let matchsParCategorie = {
        A: [],
        B: [],
        C: [],
        D: [],
        E: [],
    };

    matchsPrevus.forEach(match => {
        let categorie = match.categorie;
        if (matchsParCategorie[categorie]) {
            matchsParCategorie[categorie].push(match);
        }
    });

    let reponse = "**Matchs Restants par Catégorie :**\n";
    for (let categorie in matchsParCategorie) {
        reponse += `\n**Catégorie ${categorie}:**\n`;
        matchsParCategorie[categorie].forEach(match => {
            reponse += `- ${match.joueur1} vs ${match.joueur2}\n`;
        });
    }

    message.reply(reponse);
}



// Function: afficherAide
// Description: fonction de la commande !aide.
function afficherAide(message) {
    let reponse = "Liste des commandes par catégorie:\n";

    // Catégorie : Informations tournoi
    reponse += "\n🏓 **Informations tournoi:**\n";
    reponse += "- `!score` : Affiche les scores de tous les joueurs.\n";
    reponse += "- `!matchs` : Affiche les matchs restants à jouer.\n";
    reponse += "- `!categorie [A/B/C/D/E]` : Affiche les matchs qui ont eu lieu dans la catégorie spécifiée.\n";

    // Catégorie : Technique
    reponse += "\n👥 **Technique:**\n";
    reponse += "- `!ajouterjoueur [nomJoueur] [categorie]` : Ajoute un nouveau joueur avec sa catégorie.\n";
    reponse += "- `!ajoutermatchs [joueur1] [joueur2]` : Planifie un nouveau match.\n";
    reponse += "- `!ajouterscore [joueur1] [joueur2] [score1] [score2]` : Ajoute le score d'un match.\n";

    // Catégorie : Informations générales
    reponse += "\nℹ️ **Informations générales:**\n";
    reponse += "- `!aide` : Affiche ce message d'aide.\n";
    reponse += "- `!joueurs` : Affiche la liste des joueurs et leurs catégories.\n";

    message.reply(reponse);
}




// Function: sauvegarderDonnees
// Description: fonction qui sauvegarde les données dans les json.
function sauvegarderDonnees() {
    fs.writeFileSync('scores.json', JSON.stringify(scores, null, 2));
    fs.writeFileSync('matchsPrevus.json', JSON.stringify(matchsPrevus, null, 2));
}



// Function: chargerDonnees
// Description: fonction qui charge les données des json.
function chargerDonnees() {
    if (fs.existsSync('scores.json')) {
        scores = JSON.parse(fs.readFileSync('scores.json', 'utf8'));
    }
    if (fs.existsSync('matchsPrevus.json')) {
        matchsPrevus = JSON.parse(fs.readFileSync('matchsPrevus.json', 'utf8'));
    }
}

bot.on('ready', () => {
    chargerDonnees();
    console.log(`Connecté en tant que ${bot.user.tag}!`);
});

bot.on('messageCreate', message => {
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        switch(command) {
            case 'ajouterjoueur':
                ajouterJoueur(message, args);
                break;
            case 'ajouterscore':
                ajouterScore(message, args);
                break;
            case 'score':
                afficherScores(message);
                break;
            case 'joueurs':
                afficherJoueurs(message);
                break;
            case 'categorie':
                afficherMatchsCategorie(message, args);
                break;
            case 'matchs':
                afficherMatchsRestants(message);
                break;
            case 'ajoutermatchs':
                ajouterMatchs(message, args);
                break;
            case 'aide':
                afficherAide(message);
                break;
            default:
                message.reply('Commande inconnue. Utilisez !aide pour voir la liste des commandes.');
        }
    }
});

bot.on('error', console.error);

bot.login(token);


