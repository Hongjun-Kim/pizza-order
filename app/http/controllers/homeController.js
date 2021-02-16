const menu = require("../../models/menu");

function homeController() {
  return {
    async index(req, res) {
      // res.render("home");
      // menu.find().then(function (pizzas) {
      //   console.log(pizzas);
      //   return res.render("home", { pizzas: pizzas });
      // });
      const pizzas = await menu.find();
      // console.log(pizzas);
      return res.render("home", { pizzas: pizzas });
    },
  };
}

module.exports = homeController;
