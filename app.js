const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasStatusAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { category, search_q = "", priority, status } = request.query;
  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
      todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;

    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;

    case hasStatusAndCategoryProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      break;

    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND priority = '${priority}';`;
      break;

    case hasCategoryProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
       category = '${category}';`;
      break;

    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  data = await database.all(getTodosQuery);
  const newData = data.map(({ due_date: dueDate, ...rest }) => ({
    ...rest,
    dueDate,
  }));

  return response.send(newData);
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;

  const todo = await database.get(getTodoQuery);
  const obj = { ...todo };
  obj["dueDate"] = obj["due_date"];
  delete obj["due_date"];
  return response.send(obj);
});

// API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isValid(new Date(date))) {
    var dates = format(new Date(date), "yyyy-MM-dd");

    const getQuery = `
  SELECT
   *
  FROM
   todo
  WHERE
    due_date = '${dates}';`;
    const result = await database.all(getQuery);
    return response.send(result);
  } else {
    return response.status(400).send("Invalid Due Date");
  }
});

// API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  //   console.log(priority);
  if (priority === "MEDIUM" || priority === "HIGH" || priority === "LOW") {
  } else {
    return response.status(400).send("Invalid Todo Priority");
  }

  if (status === "DONE" || status === "TO DO" || status === "IN PROGRESS") {
  } else {
    return response.status(400).send("Invalid Todo Status");
  }

  if (category === "HOME" || category === "WORK" || category === "LEARNING") {
  } else {
    return response.status(400).send("Invalid Todo Category");
  }

  if (isValid(new Date(dueDate))) {
    var result = format(new Date(dueDate), "yyyy-MM-dd");
    const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}','${priority}', '${status}', '${category}', '${result}');`;
    const dbResponses = await database.run(postTodoQuery);
    return response.send("Todo Successfully Added");
  } else {
    return response.status(400).send("Invalid Due Date");
  }
});

// API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  //   console.log(requestBody);
  switch (true) {
    case requestBody.status !== undefined:
      if (
        requestBody.status === "DONE" ||
        requestBody.status === "TO DO" ||
        requestBody.status === "IN PROGRESS"
      ) {
        updatedColumn = "Status";
      } else {
        return response.status(400).send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      //   console.log(requestBody.priority);
      if (
        requestBody.priority === "MEDIUM" ||
        requestBody.priority === "HIGH" ||
        requestBody.priority === "LOW"
      ) {
        updatedColumn = "Priority";
        // console.log("hello");
      } else {
        return response.status(400).send("Invalid Todo Priority");
        // console.log("sdhfbd");
      }
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      if (
        requestBody.category === "HOME" ||
        requestBody.category === "WORK" ||
        requestBody.category === "LEARNING"
      ) {
        updatedColumn = "Category";
      } else {
        return response.status(400).send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      //   console.log(requestBody.dueDate);
      if (isValid(new Date(requestBody.dueDate))) {
        var result = format(new Date(requestBody.dueDate), "yyyy-MM-dd");

        updatedColumn = "Due Date";
      } else {
        return response.status(400).send("Invalid Due Date");
      }
      break;
  }
  const previousTodoQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  //   console.log(previousTodo);;
  const {
    dueDate = previousTodo.dueDate,
    category = previousTodo.category,
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  //   console.log(requestBody);

  const updateTodoQuery = `
      UPDATE
        todo
      SET
        due_date = '${result}',
        category ='${category}',
        todo='${todo}',
        priority='${priority}',
        status='${status}'
      WHERE
        id = ${todoId};`;
  //   console.log(updateTodoQuery);
  await database.run(updateTodoQuery);

  return response.send(`${updatedColumn} Updated`);
});

// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  await database.run(deleteTodoQuery);
  return response.send("Todo Deleted");
});

module.exports = app;
