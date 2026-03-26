const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.STORAGE_CONNECTION_STRING;

const tableClient = TableClient.fromConnectionString(
  connectionString,
  "engagements"
);

module.exports = async function (context, req) {

  try {

    // ===============================
    // GET engagements
    // ===============================
    if (req.method === "GET") {

      const list = [];

      const entities = tableClient.listEntities();

      for await (const entity of entities) {
        list.push(entity);
      }

      context.res = {
        status: 200,
        body: list
      };

      return;
    }

    // ===============================
    // CREATE engagement
    // ===============================
    if (req.method === "POST") {

      const engagement = req.body;

      const entity = {
        partitionKey: "engagement",
        rowKey: engagement.id,
        ...engagement
      };

      await tableClient.createEntity(entity);

      context.res = {
        status: 200,
        body: entity
      };

      return;
    }

    // ===============================
    // UPDATE engagement
    // ===============================
    if (req.method === "PUT") {

      const engagement = req.body;

      const entity = {
        partitionKey: "engagement",
        rowKey: engagement.id,
        ...engagement
      };

      await tableClient.updateEntity(entity, "Merge");

      context.res = {
        status: 200,
        body: entity
      };

      return;
    }

    // ===============================
    // ✅ DELETE engagement (FIX)
    // ===============================
    if (req.method === "DELETE") {

      const { id } = req.body;

      if (!id) {
        context.res = {
          status: 400,
          body: "Missing id"
        };
        return;
      }

      await tableClient.deleteEntity("engagement", id);

      context.res = {
        status: 200,
        body: { success: true }
      };

      return;
    }

  } catch (error) {

    context.res = {
      status: 500,
      body: error.message
    };

  }

};
