const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: orders });
}

function validateNewOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  const requiredFields = {
    deliverTo,
    mobileNumber,
    dishes,
  };

  for (let field in requiredFields) {
    if (!requiredFields[field]) {
      return next({ status: 400, message: `Order must include a ${field}` });
    }
  }

  const dishesValue = requiredFields.dishes;

  if (!Array.isArray(dishesValue) || dishesValue.length === 0) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }

  for (let i = 0; i < dishesValue.length; i++) {
    const quantity = dishesValue[i].quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }

  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function read(req, res, next) {
  const order = res.locals.order;
  res.json({ data: order });
}

function update(req, res, next) {
  const { orderId } = req.params;

  const {
    data: { id, deliverTo, mobileNumber, dishes, status } = {},
  } = req.body;

  if (id && orderId !== id) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }

  if (!status || status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  if (res.locals.order.status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  const updatedOrder = {
    deliverTo,
    mobileNumber,
    dishes,
    status,
  };

  Object.assign(res.locals.order, updatedOrder);

  res.json({ data: res.locals.order });
}

function destroy(req, res, next) {
  const orderToDelete = res.locals.order;

  if (orderToDelete.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }

  const index = orders.findIndex((order) => order.id === orderToDelete.id);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateNewOrder, create],
  read: [orderExists, read],
  update: [orderExists, validateNewOrder, update],
  delete: [orderExists, destroy],
};
