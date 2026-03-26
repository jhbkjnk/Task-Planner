const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.STORAGE_CONNECTION_STRING;
const tableClient = TableClient.fromConnectionString(connectionString, "tasks");

module.exports = async function (context, req) {
  try {
    const method = req.method;

    // ---------- GET TASKS ----------
    if (method === "GET") {
      const tasks = [];
      const engagementId = req.query?.engagementId;

      let iterator;

      if (engagementId) {
        // fast partition query
        iterator = tableClient.listEntities({
          queryOptions: {
            filter: `PartitionKey eq '${engagementId}'`
          }
        });
      } else {
        // return all tasks
        iterator = tableClient.listEntities();
      }

      for await (const entity of iterator) {
        tasks.push({
  id: entity.rowKey,
  engagementId: entity.partitionKey,
  taskName: entity.taskName || "",
  preparer: (() => {
  try {
    return entity.preparer ? JSON.parse(entity.preparer) : [];
  } catch {
    return entity.preparer ? [entity.preparer] : [];
  }
})(),

reviewer: (() => {
  try {
    return entity.reviewer ? JSON.parse(entity.reviewer) : [];
  } catch {
    return entity.reviewer ? [entity.reviewer] : [];
  }
})(),
  prepStatus: entity.prepStatus || "",
  revStatus: entity.revStatus || "",
  dueDate: entity.dueDate || "",
  archived: String(entity.archived).toLowerCase() === "true",
  createdAt: entity.createdAt || ""
});
      }

      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: tasks
      };
      return;
    }

    // ---------- CREATE TASK ----------
    if (method === "POST") {
      const task = req.body;

      if (!task || !task.id || !task.engagementId) {
        context.res = { status: 400, body: "Invalid task payload" };
        return;
      }

      const entity = {
  partitionKey: task.engagementId,
  rowKey: task.id,
  taskName: task.taskName || "",
  preparer: JSON.stringify(task.preparer || []),
  reviewer: JSON.stringify(task.reviewer || []),
  prepStatus: task.prepStatus || "",
  revStatus: task.revStatus || "",
  dueDate: task.dueDate || "",
  archived: task.archived === true,
  createdAt: task.createdAt || new Date().toISOString()
};

      await tableClient.upsertEntity(entity, "Merge");

      context.res = {
        status: 200,
        body: { success: true }
      };
      return;
    }

    // ---------- DELETE TASK ----------
    if (method === "DELETE") {
      const id = req.query?.id;
      const engagementId = req.query?.engagementId;

      if (!id || !engagementId) {
        context.res = { status: 400, body: "Missing id or engagementId" };
        return;
      }

      await tableClient.deleteEntity(engagementId, id);

      context.res = { status: 200 };
      return;
    }

    context.res = { status: 405, body: "Method not allowed" };

  } catch (err) {
    context.log("TASK API ERROR:", err);

    context.res = {
      status: 500,
      body: err.message
    };
  }
};
