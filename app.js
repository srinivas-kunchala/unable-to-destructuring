const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isMatch");
let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000);
  } catch (e) {
    console.log(`error db ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const responseObject = (eachEl) => {
  return {
    id: eachEl.id,
    todo: eachEl.todo,
    priority: eachEl.priority,
    status: eachEl.status,
    category: eachEl.category,
    dueDate: eachEl.due_date,
  };
};

app.get(`/todos/`, async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let todoGetQuery = "";
  //ON STATUS
  const getTodosOnStatus = `
    select * from todo where status = '${status}'
  `;
  const resultOnStatus = await db.all(getTodosOnStatus);
  const isStatusIncludes = resultOnStatus.map((eachEl) => eachEl.status);

  //ON PRIORITY
  const getTodosOnPriority = `
select * from todo where priority = '${priority}'
`;
  const resultOnPriority = await db.all(getTodosOnPriority);
  const isPriorityIncludes = resultOnPriority.map((eachEl) => eachEl.priority);

  switch (true) {
    case category !== undefined && priority !== undefined:
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          todoGetQuery = `
            select * from todo where priority = '${priority}'
            and category = '${category}'
            `;
          const dbResponse = await db.all(todoGetQuery);
          response.send(dbResponse.map((each) => responseObject(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case category !== undefined && status !== undefined:
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          todoGetQuery = `
                select * from todo where status = '${status}'
                and category = '${category}'
                `;
          const dbResponse = await db.all(todoGetQuery);
          response.send(dbResponse.map((each) => responseObject(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case priority !== undefined && status !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          todoGetQuery = `
            select * from todo where priority = '${priority}'
            and status = '${status}'
            `;
          const dbResponse = await db.all(todoGetQuery);
          response.send(dbResponse.map((each) => responseObject(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case status !== undefined:
      if (isStatusIncludes.includes(status)) {
        todoGetQuery = `
            select * from todo where status = '${status}'
            `;
        const dbResponse = await db.all(todoGetQuery);
        response.send(
          dbResponse.map((eachProperty) => responseObject(eachProperty))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (isPriorityIncludes.includes(priority)) {
        todoGetQuery = `
          select * from todo where priority = '${priority}'
          `;
        const dbResponse = await db.all(todoGetQuery);
        response.send(dbResponse.map((each) => responseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case category !== undefined:
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        todoGetQuery = `
              select * from todo where category = '${category}'
              `;
        const dbResponse = await db.all(todoGetQuery);
        response.send(dbResponse.map((each) => responseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case search_q !== undefined:
      todoGetQuery = `
            select * from todo where todo like '%${search_q}%'

            `;
      const dbResponse = await db.all(todoGetQuery);
      response.send(dbResponse.map((each) => responseObject(each)));

      break;
    default:
      todoGetQuery = ` select * from todo`;
      const dbData = await db.all(todoGetQuery);
      response.send(dbData.map((each) => responseObject(each)));
  }
});

app.get(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
    select * from todo where id = ${todoId}
    `;
  const dbResponse = await db.get(getQuery);
  response.send(responseObject(dbResponse));
});

app.get(`/agenda/`, async (request, response) => {
  const { date } = request.query;
  const newDate = isValid(date, "yyyy-MM-dd");

  if (newDate) {
    const dateFormat = format(new Date(date), "yyyy-MM-dd");
    const getDueDateBasedQuery = `
    select * from todo where due_date = '${dateFormat}'
    `;
    const data = await db.all(getDueDateBasedQuery);
    response.send(data.map((each) => responseObject(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category } = request.body;
});

app.put(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;

  const requestBody = request.body;

  const previousTodo = `
  select * from todo where id = ${todoId};
  `;
  const dbResponse = await db.get(previousTodo);

  const {
    todo = dbResponse.todo,
    priority = dbResponse.priority,
    status = dbResponse.status,
    category = dbResponse.category,
    dueDate = dbResponse.due_date,
  } = request.body;

  let updateQuery;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `
              update todo 
              set status = '${status}'
              where id = ${todoId}
              `;
        await db.run(updateQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.category !== undefined:
      if (
        category === "HOME" ||
        category === "LEARNING" ||
        category === "WORK"
      ) {
        updateQuery = `
             
             update todo
             set category='${category}'
             where id = ${todoId}
             `;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateQuery = `
          update todo
          set priority = '${priority}'
          where id = ${todoId}
          `;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isValid(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");

        updateQuery = `
              update todo 
              set due_date = '${newdate}'
              where id = ${todoId}
              `;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

app.delete(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    delete from todo where id = ${todoId}
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
