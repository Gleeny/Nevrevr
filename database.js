const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const guildSchema = mongoose.Schema({
  guildid: String,
  language: String
}, { minimize: false })

const globalSchema = mongoose.Schema({
  questionsTotal: Number
}, { minimize: false })

const statisticSchema = mongoose.Schema({
  category: String,
  id: Number,
  haveNever: Number,
  have: Number
}, { minimize: false });

const Guild = mongoose.model("Guild", guildSchema);
const Global = mongoose.model("Global", globalSchema);
const Statistic = mongoose.model("Statistic", statisticSchema);

module.exports = {
  getGuild: function(guildid) {
    return new Promise(function(resolve, reject) {
      Guild.findOne({
        guildid: guildid
      }, (err, guild) => {
        if (err) return reject(err);
        if (!guild) {
          let newGuild = new Guild({
            guildid: guildid
          })
          
          return resolve(newGuild);
        } else return resolve(guild);
      })
    })
  },
  getGlobal: function() {
    return new Promise(function(resolve, reject) {
      Global.findOne({}, (err, global) => {
        if (err) return reject(err);
        if (!global) {
          let newGlobal = new Global({
            questionsTotal: 0
          })
          
          return resolve(newGlobal);
        } else return resolve(global);
      });
    })
  },
  getStatistic: function(category, id) {
    return new Promise(function(resolve, reject) {
      Statistic.findOne({
        category: category.toLowerCase(),
        id: id
      }, (err, statistic) => {
        if (err) return reject(err);
        if (!statistic) {
          let newStatistic = new Statistic({
            category: category.toLowerCase(),
            id: id,
            have: 0,
            haveNever: 0
          })
          
          return resolve(newStatistic);
        } else return resolve(statistic);
      });
    })
  }
}