const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: dishes });
}

function validateNewDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const requiredFields = {
    name,
    description,
    price,
    image_url,
  };

  for (let field in requiredFields) {
    if (!requiredFields[field]) {
      return next({ status: 400, message: `Dish must include a ${field}` });
    }
  }

  const priceValue = requiredFields.price;

  if (typeof priceValue !== "number" || priceValue <= 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  next();
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }

  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function read(req, res, next) {
  const dish = res.locals.dish;
  res.json({ data: dish });
}

function update(req, res, next) {
  const { dishId } = req.params;

  const { data: { id, name, description, price, image_url } = {} } = req.body;

  if (id && dishId !== id) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  const updatedDish = {
    name,
    description,
    price,
    image_url,
  };

  Object.assign(res.locals.dish, updatedDish);

  res.json({ data: res.locals.dish });
}

module.exports = {
  list,
  create: [validateNewDish, create],
  read: [dishExists, read],
  update: [dishExists, validateNewDish, update],
};
